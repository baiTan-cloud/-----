package com.resumebuilder.service;

import com.resumebuilder.entity.DailyRecord;
import com.resumebuilder.entity.Template;
import com.resumebuilder.entity.TemplateSection;
import com.resumebuilder.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 模板渲染引擎。
 * 接收 Template（含 sections）+ 数据 → 替换占位符 → 输出结构化渲染结果。
 *
 * 占位符格式：{{fieldName}}
 * 支持的数据来源：
 *   - personal 节：User 实体字段（name, email, phone）
 *   - list 节：DailyRecord 实体字段（title, role, whatDone, outcome 等）
 */
@Service
@RequiredArgsConstructor
public class TemplateRenderEngine {

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{(\\w+)\\}\\}");

    private static final SimpleDateFormat DATE_FMT = new SimpleDateFormat("yyyy.MM");

    // ======================== 渲染结果 ========================

    /** 单个节的渲染结果 */
    @lombok.Data
    @lombok.Builder
    public static class SectionResult {
        private String sectionId;
        private String label;
        private String type;               // personal | list
        private String rendered;           // 渲染后的 HTML 片段
        private String plainText;          // 纯文本版本（用于 Word）
        private int sortOrder;
    }

    /** 完整模板渲染结果 */
    @lombok.Data
    @lombok.Builder
    public static class RenderResult {
        private String templateName;
        private List<SectionResult> sections;
        /** 合并所有 section 的纯文本 */
        public String toPlainText() {
            return sections.stream()
                    .map(SectionResult::getPlainText)
                    .filter(s -> s != null && !s.isEmpty())
                    .collect(Collectors.joining("\n\n"));
        }
        /** 合并所有 section 的 HTML */
        public String toHtml() {
            return sections.stream()
                    .map(SectionResult::getRendered)
                    .filter(s -> s != null && !s.isEmpty())
                    .collect(Collectors.joining("\n"));
        }
    }

    // ======================== 入口 ========================

    /**
     * 渲染模板。
     *
     * @param template  模板（含 sections 定义）
     * @param user      当前用户
     * @param records   用户的所有日常记录（用于 list 节）
     * @return 渲染结果
     */
    public RenderResult render(Template template, User user, List<DailyRecord> records) {
        if (template.getSections() == null || template.getSections().isEmpty()) {
            return RenderResult.builder()
                    .templateName(template.getName())
                    .sections(Collections.emptyList())
                    .build();
        }

        // 按记录类型分组
        Map<String, List<DailyRecord>> recordsByType = records.stream()
                .filter(r -> r.getType() != null)
                .collect(Collectors.groupingBy(DailyRecord::getType));

        List<SectionResult> results = new ArrayList<>();

        for (TemplateSection section : template.getSections()) {
            SectionResult result;
            switch (section.getType()) {
                case "personal":
                    result = renderPersonal(section, user);
                    break;
                case "list":
                    result = renderList(section, recordsByType.getOrDefault(section.getDataBinding(), Collections.emptyList()));
                    break;
                default:
                    result = SectionResult.builder()
                            .sectionId(section.getId())
                            .label(section.getLabel())
                            .type(section.getType())
                            .rendered("")
                            .plainText("")
                            .sortOrder(section.getSortOrder() != null ? section.getSortOrder() : 0)
                            .build();
            }
            results.add(result);
        }

        results.sort(Comparator.comparingInt(SectionResult::getSortOrder));

        return RenderResult.builder()
                .templateName(template.getName())
                .sections(results)
                .build();
    }

    // ======================== Personal 节渲染 ========================

    private SectionResult renderPersonal(TemplateSection section, User user) {
        if (section.getContentTemplate() == null || section.getContentTemplate().isEmpty()) {
            return emptyResult(section);
        }

        Map<String, String> fieldMap = buildUserFieldMap(user);
        String rendered = replacePlaceholders(section.getContentTemplate(), fieldMap);
        String plainText = stripHtml(rendered);

        return SectionResult.builder()
                .sectionId(section.getId())
                .label(section.getLabel())
                .type("personal")
                .rendered(wrapStyle(rendered, section))
                .plainText(plainText)
                .sortOrder(section.getSortOrder() != null ? section.getSortOrder() : 0)
                .build();
    }

    // ======================== List 节渲染 ========================

    private SectionResult renderList(TemplateSection section, List<DailyRecord> records) {
        if (records.isEmpty()) {
            return emptyResult(section);
        }

        StringBuilder html = new StringBuilder();
        StringBuilder plain = new StringBuilder();

        // 标题
        String title = section.getTitleTemplate() != null ? section.getTitleTemplate() : "";
        if (!title.isEmpty()) {
            String titleStyle = extractStyle(section, "title");
            html.append("<div style=\"").append(titleStyle).append("\">")
                    .append(escapeHtml(title)).append("</div>\n");
            plain.append(title).append("\n");
        }

        // 按时间排序
        List<DailyRecord> sorted = records.stream()
                .sorted(Comparator.comparing(DailyRecord::getStartDate,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        for (int i = 0; i < sorted.size(); i++) {
            DailyRecord record = sorted.get(i);
            Map<String, String> fieldMap = buildRecordFieldMap(record);

            // 主内容模板
            if (section.getItemTemplate() != null) {
                String item = replacePlaceholders(section.getItemTemplate(), fieldMap);
                String itemStyle = extractStyle(section, "item");
                html.append("<div style=\"").append(itemStyle).append("\">")
                        .append(escapeHtml(item)).append("</div>\n");
                plain.append(item).append("\n");
            }

            // 详情模板
            if (section.getDetailTemplate() != null) {
                String detail = replacePlaceholders(section.getDetailTemplate(), fieldMap);
                if (!detail.isEmpty()) {
                    String detailStyle = extractStyle(section, "detail");
                    html.append("<div style=\"").append(detailStyle).append("\">")
                            .append(escapeHtml(detail)).append("</div>\n");
                    plain.append(detail).append("\n");
                }
            }

            if (i < sorted.size() - 1) {
                html.append("<div style=\"height:8px\"></div>\n");
            }
        }

        return SectionResult.builder()
                .sectionId(section.getId())
                .label(section.getLabel())
                .type("list")
                .rendered(wrapStyle(html.toString(), section))
                .plainText(plain.toString().trim())
                .sortOrder(section.getSortOrder() != null ? section.getSortOrder() : 0)
                .build();
    }

    // ======================== 占位符替换 ========================

    /**
     * 替换模板字符串中的 {{占位符}}。
     * 未匹配到的占位符保留原样。
     */
    public String replacePlaceholders(String template, Map<String, String> values) {
        if (template == null) return "";
        StringBuffer result = new StringBuffer();
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(template);
        while (matcher.find()) {
            String key = matcher.group(1);
            String replacement = values.getOrDefault(key, matcher.group(0));
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);
        return result.toString().trim();
    }

    // ======================== 字段映射 ========================

    private Map<String, String> buildUserFieldMap(User user) {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("name", nullSafe(user.getName()));
        map.put("email", nullSafe(user.getEmail()));
        map.put("phone", nullSafe(user.getPhone()));
        return map;
    }

    private Map<String, String> buildRecordFieldMap(DailyRecord r) {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("title", nullSafe(r.getTitle()));
        map.put("role", nullSafe(r.getRole()));
        map.put("orgName", nullSafe(r.getOrgName()));
        map.put("whatDone", nullSafe(r.getWhatDone()));
        map.put("challenge", nullSafe(r.getChallenge()));
        map.put("solution", nullSafe(r.getSolution()));
        map.put("outcome", nullSafe(r.getOutcome()));
        map.put("startDate", r.getStartDate() != null ? DATE_FMT.format(r.getStartDate()) : "");
        map.put("endDate", r.getEndDate() != null ? DATE_FMT.format(r.getEndDate()) : "至今");
        map.put("skills", r.getSkills() != null ? String.join("、", r.getSkills()) : "");
        map.put("achievements", r.getAchievements() != null ? String.join("；", r.getAchievements()) : "");
        map.put("major", nullSafe(r.getMajor()));
        map.put("degree", nullSafe(r.getDegree()));
        map.put("gpa", nullSafe(r.getGpa()));
        map.put("description", nullSafe(r.getDescription()));
        return map;
    }

    // ======================== 样式辅助 ========================

    private String wrapStyle(String content, TemplateSection section) {
        if (section.getStyle() == null || section.getStyle().isEmpty()) {
            return "<div>" + content + "</div>";
        }
        StringBuilder style = new StringBuilder();
        appendStyle(style, section.getStyle(), "marginBottom");
        appendStyle(style, section.getStyle(), "paddingTop");
        appendStyle(style, section.getStyle(), "paddingBottom");
        appendStyle(style, section.getStyle(), "backgroundColor", "background-color");
        return "<div style=\"" + style + "\">" + content + "</div>";
    }

    /** 从 section style 中提取特定前缀的样式（title/item/detail） */
    private String extractStyle(TemplateSection section, String prefix) {
        if (section.getStyle() == null) return "";
        StringBuilder sb = new StringBuilder();
        Map<String, Object> style = section.getStyle();
        // 通用样式
        appendStyle(sb, style, prefix + "FontSize", "font-size", "px");
        appendStyle(sb, style, prefix + "Color", "color");
        appendStyle(sb, style, prefix + "FontWeight", "font-weight");
        appendStyle(sb, style, prefix + "TextAlign", "text-align");
        return sb.toString();
    }

    private void appendStyle(StringBuilder sb, Map<String, Object> style, String key) {
        appendStyle(sb, style, key, key.replaceAll("([A-Z])", "-$1").toLowerCase());
    }

    private void appendStyle(StringBuilder sb, Map<String, Object> style, String key, String cssKey) {
        appendStyle(sb, style, key, cssKey, "");
    }

    @SuppressWarnings("unchecked")
    private void appendStyle(StringBuilder sb, Map<String, Object> style, String key, String cssKey, String unit) {
        if (style.containsKey(key)) {
            Object val = style.get(key);
            if (val instanceof Number) {
                sb.append(cssKey).append(":").append(val).append(unit).append(";");
            } else {
                sb.append(cssKey).append(":").append(val).append(";");
            }
        }
    }

    // ======================== 工具 ========================

    private String nullSafe(String s) {
        return s != null ? s : "";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]+>", "").trim();
    }

    private SectionResult emptyResult(TemplateSection section) {
        return SectionResult.builder()
                .sectionId(section.getId())
                .label(section.getLabel())
                .type(section.getType())
                .rendered("")
                .plainText("")
                .sortOrder(section.getSortOrder() != null ? section.getSortOrder() : 0)
                .build();
    }
}
