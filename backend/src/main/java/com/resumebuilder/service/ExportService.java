package com.resumebuilder.service;

import com.deepoove.poi.XWPFTemplate;
import com.resumebuilder.entity.DailyRecord;
import com.resumebuilder.entity.ResumeLayout;
import com.resumebuilder.entity.Template;
import com.resumebuilder.entity.User;
import com.resumebuilder.repository.DailyRecordRepository;
import com.resumebuilder.repository.ResumeLayoutRepository;
import com.resumebuilder.repository.TemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 简历导出服务
 * 根据布局 JSON 的 binding 字段从数据库取数据 → 预渲染为文本 → 填充 Word 模板
 */
@Service
@RequiredArgsConstructor
public class ExportService {

    private final DailyRecordRepository recordRepository;
    private final ResumeLayoutRepository layoutRepository;
    private final TemplateRepository templateRepository;
    private final AuthService authService;

    @Value("${user.dir}")
    private String userDir;

    public String getUserName(String userId) {
        User user = authService.getUserById(userId);
        return user.getName();
    }

    public byte[] generateResume(String userId, String layoutId) throws Exception {
        // 1. 加载布局
        ResumeLayout layout = layoutRepository.findById(layoutId)
                .orElseThrow(() -> new RuntimeException("布局不存在: " + layoutId));
        if (!layout.getUserId().equals(userId)) {
            throw new RuntimeException("无权访问此布局");
        }

        // 2. 获取关联模板
        String templateId = layout.getTemplateId();
        Template template;
        if (templateId != null) {
            template = templateRepository.findById(templateId)
                    .orElseThrow(() -> new RuntimeException("关联模板不存在"));
        } else {
            template = templateRepository.findAllByOrderByUsageCountDesc().stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("系统中没有可用模板"));
        }

        // 3. 读取 Word 模板文件
        String wordTemplateKey = template.getWordTemplateKey();
        File templateFile = Paths.get(userDir, "templates", wordTemplateKey).toFile();
        if (!templateFile.exists()) {
            throw new RuntimeException("Word 模板文件不存在: " + templateFile.getAbsolutePath());
        }

        // 4. 获取数据
        User user = authService.getUserById(userId);
        List<DailyRecord> allRecords = recordRepository.findByUserIdAndDeletedFalse(userId);

        // 5. 根据布局 binding 拉取数据，预渲染为纯文本
        Map<String, Object> data = new HashMap<>();
        data.put("name", user.getName());
        data.put("email", user.getEmail());

        // 解析 Puck 数据中的 content 数组，提取各组件的 binding
        StringBuilder contentBuilder = new StringBuilder();
        Map<String, Object> puckData = layout.getLayoutData().getPuckData();

        if (puckData != null && puckData.containsKey("content")) {
            List<Map<String, Object>> content = (List<Map<String, Object>>) puckData.get("content");
            for (Map<String, Object> comp : content) {
                Map<String, Object> props = (Map<String, Object>) comp.get("props");
                if (props == null) continue;
                String binding = (String) props.get("binding");
                if (binding == null || binding.isEmpty()) continue;

                String sectionText = resolveAndRender(binding, allRecords);
                if (sectionText != null && !sectionText.isEmpty()) {
                    if (contentBuilder.length() > 0) contentBuilder.append("\n\n");
                    contentBuilder.append(sectionText);
                }
            }
        }

        data.put("content", contentBuilder.toString());

        // 6. poi-tl 渲染
        try (InputStream is = new FileInputStream(templateFile)) {
            XWPFTemplate xwpfTemplate = XWPFTemplate.compile(is).render(data);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            xwpfTemplate.writeAndClose(bos);
            return bos.toByteArray();
        }
    }

    /**
     * 解析 binding 字段，返回预渲染的纯文本内容
     */
    private String resolveAndRender(String binding, List<DailyRecord> allRecords) {
        // user.xxx — 已通过 data map 传入，跳过
        if (binding.startsWith("user.")) return null;

        // records[type=xxx]
        Pattern pattern = Pattern.compile("records\\[type=(\\w+)\\]");
        Matcher matcher = pattern.matcher(binding);
        if (matcher.matches()) {
            String type = matcher.group(1);
            String sectionTitle = getSectionTitle(type);

            List<DailyRecord> filtered = allRecords.stream()
                    .filter(r -> type.equals(r.getType()))
                    .sorted(Comparator.comparing(DailyRecord::getStartDate,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .collect(Collectors.toList());

            if (filtered.isEmpty()) return null;

            StringBuilder sb = new StringBuilder();
            sb.append("【").append(sectionTitle).append("】\n");

            for (DailyRecord r : filtered) {
                sb.append(r.getTitle());
                if (r.getStartDate() != null || r.getEndDate() != null) {
                    sb.append("（").append(formatDate(r.getStartDate()));
                    sb.append(" - ").append(formatDate(r.getEndDate())).append("）");
                }
                sb.append("\n");

                if (r.getDescription() != null && !r.getDescription().isEmpty()) {
                    sb.append(r.getDescription()).append("\n");
                }

                // 成果列表
                List<String> achievements = parseAchievements(r);
                for (String ach : achievements) {
                    sb.append("· ").append(ach).append("\n");
                }
                sb.append("\n");
            }

            return sb.toString().trim();
        }

        return null;
    }

    private String getSectionTitle(String type) {
        switch (type) {
            case "education": return "教育经历";
            case "project": return "项目经历";
            case "internship": return "实习经历";
            case "competition": return "竞赛经历";
            case "skill": return "技能";
            case "certification": return "证书";
            default: return type;
        }
    }

    private List<String> parseAchievements(DailyRecord record) {
        if (record.getAchievements() != null && !record.getAchievements().isEmpty()) {
            return record.getAchievements();
        }
        if (record.getDescription() != null) {
            return Arrays.stream(record.getDescription().split("\n"))
                    .filter(line -> line.startsWith("-") || line.startsWith("·") || line.matches("\\d+\\..*"))
                    .map(line -> line.replaceAll("^[-·\\d.\\s]+", "").trim())
                    .filter(s -> !s.isEmpty())
                    .limit(5)
                    .collect(Collectors.toList());
        }
        return Collections.emptyList();
    }

    private String formatDate(Date date) {
        if (date == null) return "至今";
        return new SimpleDateFormat("yyyy.MM").format(date);
    }
}
