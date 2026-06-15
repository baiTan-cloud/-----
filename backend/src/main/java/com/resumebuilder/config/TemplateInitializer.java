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
 * 使用最简单的 {{key}} 标签，避免使用 {{#loop}} 语法
 * 列表数据由 ExportService 预渲染为纯文本再传入
 */
@Component
public class TemplateInitializer implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        createTemplate("tech_blue.docx", "简约科技蓝", "1890ff");
        createTemplate("simple_elegant.docx", "学术简洁", "262626");
        createTemplate("modern_dual.docx", "现代双栏", "2f54eb");
    }

    private void createTemplate(String fileName, String name, String accentColor) throws Exception {
        Path templateDir = Paths.get(System.getProperty("user.dir"), "templates");
        Files.createDirectories(templateDir);
        Path file = templateDir.resolve(fileName);
        if (Files.exists(file)) {
            System.out.println("[Template] 模板已存在: " + file.toAbsolutePath());
            return;
        }

        XWPFDocument doc = new XWPFDocument();

        // 标题
        XWPFParagraph titlePara = doc.createParagraph();
        titlePara.setAlignment(ParagraphAlignment.CENTER);
        addRun(titlePara, "{{name}}", true, 26, accentColor, "Microsoft YaHei");

        // 联系方式
        XWPFParagraph contactPara = doc.createParagraph();
        contactPara.setAlignment(ParagraphAlignment.CENTER);
        addRun(contactPara, "{{email}}", false, 11, "595959", "Microsoft YaHei");
        contactPara.setSpacingAfter(300);

        // 所有内容由后端预渲染后直接填入 {{content}}
        // 这样避免 poi-tl 的 {{#loop}} 语法兼容性问题
        addSectionHeader(doc, "个人简介", accentColor);
        XWPFParagraph contentPara = doc.createParagraph();
        addRun(contentPara, "{{content}}", false, 11, "262626", "Microsoft YaHei");

        saveDoc(doc, file);
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

    private void addSectionHeader(XWPFDocument doc, String text, String color) {
        XWPFParagraph para = doc.createParagraph();
        para.setSpacingBefore(300);
        para.setSpacingAfter(60);
        addRun(para, text, true, 14, color, "Microsoft YaHei");

        XWPFParagraph line = doc.createParagraph();
        line.setSpacingAfter(200);
        XWPFRun lineRun = line.createRun();
        lineRun.setText("─────────────────────────────────");
        lineRun.setColor(color);
        lineRun.setFontSize(8);
    }

    private void saveDoc(XWPFDocument doc, Path file) throws Exception {
        try (FileOutputStream out = new FileOutputStream(file.toFile())) {
            doc.write(out);
        }
        doc.close();
        System.out.println("[Template] 已创建模板: " + file.getFileName() + " -> " + file.toAbsolutePath());
    }
}
