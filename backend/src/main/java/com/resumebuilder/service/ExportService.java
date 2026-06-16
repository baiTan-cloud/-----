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
 * 根据布局的 binding 字段拉取记录 → 按 slot 智能提取关键内容 → 填充 Word 模板
 *
 * 模板 slot 标签：
 *   {{name}} / {{email}} — 用户信息
 *   {{project_section}} / {{internship_section}} / {{education_section}}
 *   {{skill_section}} / {{certification_section}} / {{competition_section}}
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

    /** 动作关键词——包含这些词的句子大概率是"做了什么" */
    private static final Set<String> ACTION_KEYWORDS = Set.of(
            "实现", "完成", "负责", "设计", "开发", "优化", "引入", "搭建",
            "构建", "重构", "整合", "集成", "部署", "编写", "创建",
            "提升了", "提高了", "降低了", "减少了", "达到了", "实现了"
    );

    /** 成果特征——包含这些词的句子大概率是成果 */
    private static final Pattern NUMBER_PATTERN = Pattern.compile(
            "(\\d+[%倍率]|QPS|TPS|吞吐|延迟|响应时间|覆盖率|准确率|召回率|AUC|F1)"
    );

    /** 按 。！？\n 拆句 */
    private static final Pattern SENTENCE_SPLIT = Pattern.compile("[。！？\\n]+");

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

        // 5. 构建 slot 数据
        Map<String, Object> data = new HashMap<>();
        data.put("name", user.getName());
        data.put("email", user.getEmail());

        // 解析布局 binding 字段，提取各 section 数据
        Map<String, Object> puckData = layout.getLayoutData().getPuckData();
        if (puckData != null && puckData.containsKey("content")) {
            List<Map<String, Object>> content = (List<Map<String, Object>>) puckData.get("content");
            for (Map<String, Object> comp : content) {
                Map<String, Object> props = (Map<String, Object>) comp.get("props");
                if (props == null) continue;
                String binding = (String) props.get("binding");
                if (binding == null || binding.isEmpty()) continue;

                // records[type=xxx]
                Pattern bindingPattern = Pattern.compile("records\\[type=(\\w+)\\]");
                Matcher matcher = bindingPattern.matcher(binding);
                if (matcher.matches()) {
                    String type = matcher.group(1);
                    String slotKey = type + "_section";
                    if (!data.containsKey(slotKey)) {
                        String sectionText = renderSection(type, allRecords);
                        data.put(slotKey, sectionText != null ? sectionText : "");
                    }
                }
            }
        }

        // 确保所有常见 slot 都有值（防止 poi-tl 报错）
        for (String slot : new String[]{"project_section", "internship_section", "education_section",
                "skill_section", "certification_section", "competition_section"}) {
            data.putIfAbsent(slot, "");
        }

        // 6. poi-tl 渲染
        try (InputStream is = new FileInputStream(templateFile)) {
            XWPFTemplate xwpfTemplate = XWPFTemplate.compile(is).render(data);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            xwpfTemplate.writeAndClose(bos);
            return bos.toByteArray();
        }
    }

    // ==================== Section 渲染 ====================

    /** 渲染某一类型的所有记录为一个 section 文本 */
    private String renderSection(String type, List<DailyRecord> allRecords) {
        List<DailyRecord> filtered = allRecords.stream()
                .filter(r -> type.equals(r.getType()))
                .sorted(Comparator.comparing(DailyRecord::getStartDate,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        if (filtered.isEmpty()) return null;

        StringBuilder sb = new StringBuilder();
        for (DailyRecord r : filtered) {
            // ── 标题行：名称 + 时间 ──
            sb.append(r.getTitle());
            if (r.getStartDate() != null || r.getEndDate() != null) {
                sb.append("  ").append(formatDate(r.getStartDate()));
                sb.append(" - ").append(formatDate(r.getEndDate()));
            }
            sb.append("\n");

            // ── 关键行动（提取） ──
            List<String> actions = extractKeyActions(r.getDescription());
            for (String action : actions) {
                sb.append("· ").append(action).append("\n");
            }

            // ── 成果列表 ──
            List<String> achievements = getAchievements(r);
            for (String ach : achievements) {
                sb.append("· ").append(ach).append("\n");
            }

            // ── 技能标签 ──
            if (r.getSkills() != null && !r.getSkills().isEmpty()) {
                sb.append("  技能：").append(String.join(" / ", r.getSkills())).append("\n");
            }

            sb.append("\n");
        }

        return sb.toString().trim();
    }

    // ==================== 提取引擎 ====================

    /**
     * 从描述文本中提取关键行动句（履历风格）
     * 策略：
     *   1. 拆句
     *   2. 保留含动作关键词或数字成果的句子
     *   3. 去主语（我/我们/项目）
     *   4. 限制最多 4 句
     */
    List<String> extractKeyActions(String description) {
        if (description == null || description.isBlank()) return Collections.emptyList();

        String[] sentences = SENTENCE_SPLIT.split(description);
        List<String> result = new ArrayList<>();

        for (String raw : sentences) {
            String s = raw.trim();
            if (s.length() < 6) continue; // 太短跳过

            // 判断是否包含动作关键词 或 数字成果
            boolean hasAction = ACTION_KEYWORDS.stream().anyMatch(s::contains);
            boolean hasNumber = NUMBER_PATTERN.matcher(s).find();

            if (hasAction || hasNumber) {
                // 去主语
                s = s.replaceAll("^[我我们项目团队]*(主要负责|负责|参与|主导|完成了|实现了|设计了|开发了|优化了)", "")
                       .replaceAll("^[我我们项目团队]*", "")
                       .trim();
                if (s.length() > 4 && !result.contains(s)) {
                    result.add(s);
                }
            }
        }

        // 如果一条都没提取到，取前 60 字
        if (result.isEmpty()) {
            String fallback = description.replaceAll("[\\n\\r]+", " ").trim();
            if (fallback.length() > 60) fallback = fallback.substring(0, 60) + "...";
            if (fallback.length() > 4) result.add(fallback);
        }

        return result.size() > 4 ? result.subList(0, 4) : result;
    }

    /** 获取成果列表（优先 achievements 字段，其次从描述中提取） */
    private List<String> getAchievements(DailyRecord record) {
        if (record.getAchievements() != null && !record.getAchievements().isEmpty()) {
            return record.getAchievements();
        }
        // 从 entries 中收集
        if (record.getEntries() != null) {
            List<String> fromEntries = record.getEntries().stream()
                    .filter(e -> e.getAchievements() != null)
                    .flatMap(e -> e.getAchievements().stream())
                    .collect(Collectors.toList());
            if (!fromEntries.isEmpty()) return fromEntries;
        }
        // 从描述文本中提取含数字的句子
        if (record.getDescription() != null) {
            return Arrays.stream(SENTENCE_SPLIT.split(record.getDescription()))
                    .filter(s -> NUMBER_PATTERN.matcher(s).find())
                    .map(String::trim)
                    .filter(s -> s.length() > 4)
                    .limit(3)
                    .collect(Collectors.toList());
        }
        return Collections.emptyList();
    }

    private String formatDate(Date date) {
        if (date == null) return "至今";
        return new SimpleDateFormat("yyyy.MM").format(date);
    }
}
