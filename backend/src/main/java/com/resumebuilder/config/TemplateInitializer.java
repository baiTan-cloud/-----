package com.resumebuilder.config;

import org.apache.poi.xwpf.usermodel.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 项目启动时自动创建 poi-tl Word 模板文件
 * 使用多 slot 标签，每个 section 独立占位：
 *   {{name}} / {{email}} / {{contact}}
 *   {{project_section}} / {{internship_section}} / {{education_section}}
 *   {{skill_section}} / {{certification_section}} / {{competition_section}}
 * 数据由 ExportService 按 slot 提取预渲染后填入
 */
@Component
public class TemplateInitializer implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        createTemplate("tech_blue.docx", "简约科技蓝", "1890ff",
                new String[]{"project_section", "internship_section", "education_section", "skill_section"});
        createTemplate("simple_elegant.docx", "学术简洁", "262626",
                new String[]{"project_section", "education_section", "skill_section"});
        createTemplate("modern_dual.docx", "现代双栏", "2f54eb",
                new String[]{"project_section", "internship_section", "education_section", "skill_section", "certification_section"});
    }

    private void createTemplate(String fileName, String name, String accentColor,
                                String[] sectionSlots) throws Exception {
        Path templateDir = Paths.get(System.getProperty("user.dir"), "templates");
        Files.createDirectories(templateDir);
        Path file = templateDir.resolve(fileName);
        if (Files.exists(file)) {
            System.out.println("[Template] 模板已存在: " + file.toAbsolutePath());
            return;
        }

        XWPFDocument doc = new XWPFDocument();

        // === 标题 ===
        XWPFParagraph titlePara = doc.createParagraph();
        titlePara.setAlignment(ParagraphAlignment.CENTER);
        addRun(titlePara, "{{name}}", true, 26, accentColor, "Microsoft YaHei");

        // === 联系方式 ===
        XWPFParagraph contactPara = doc.createParagraph();
        contactPara.setAlignment(ParagraphAlignment.CENTER);
        addRun(contactPara, "{{email}}", false, 11, "595959", "Microsoft YaHei");
        contactPara.setSpacingAfter(300);

        // === 各 Section Slot（按配置逐个生成） ===
        for (String slot : sectionSlots) {
            addSectionSlot(doc, slot, accentColor);
        }

        saveDoc(doc, file);
    }

    /**
     * 生成一个 section slot 区域：标题 + {{slot_name}} 占位
     */
    private void addSectionSlot(XWPFDocument doc, String slotKey, String accentColor) {
        // Section 标题（中文映射）
        String sectionTitle = getSectionTitle(slotKey);
        if (sectionTitle == null) return;

        XWPFParagraph headerPara = doc.createParagraph();
        headerPara.setSpacingBefore(300);
        headerPara.setSpacingAfter(60);
        addRun(headerPara, sectionTitle, true, 14, accentColor, "Microsoft YaHei");

        // 分割线
        XWPFParagraph line = doc.createParagraph();
        line.setSpacingAfter(120);
        XWPFRun lineRun = line.createRun();
        lineRun.setText("─────────────────────────────────");
        lineRun.setColor(accentColor);
        lineRun.setFontSize(8);

        // Slot 占位内容
        XWPFParagraph slotPara = doc.createParagraph();
        slotPara.setSpacingAfter(300);
        addRun(slotPara, "{{" + slotKey + "}}", false, 11, "262626", "Microsoft YaHei");
    }

    private String getSectionTitle(String slotKey) {
        switch (slotKey) {
            case "project_section":          return "项目经历";
            case "internship_section":       return "实习经历";
            case "education_section":        return "教育经历";
            case "skill_section":            return "专业技能";
            case "certification_section":    return "证书";
            case "competition_section":      return "竞赛经历";
            default:                         return null;
        }
    }

    private void addRun(XWPFParagraph para, String text, boolean bold,
                        int fontSize, String color, String fontFamily) {
        XWPFRun run = para.createRun();
        run.setText(text);
        run.setBold(bold);
        run.setFontSize(fontSize);
        if (color != null) run.setColor(color);
        if (fontFamily != null) run.setFontFamily(fontFamily);
    }

    private void saveDoc(XWPFDocument doc, Path file) throws Exception {
        try (FileOutputStream out = new FileOutputStream(file.toFile())) {
            doc.write(out);
        }
        doc.close();
        System.out.println("[Template] 已创建模板: " + file.getFileName());
    }
}
