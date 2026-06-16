package com.resumebuilder.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Data
@Document(collection = "templates")
public class Template {
    @Id
    private String id;

    @Indexed
    private String name;

    private String thumbnailUrl;

    /** Word 导出模板文件名（如 tech_blue.docx） */
    private String wordTemplateKey;

    /**
     * ===== 新版：section-based 模板结构 =====
     * 模板由多个节(section)组成，每个节定义了数据来源、文案模板和样式。
     * 取代旧版的 Puck layout 模式。
     */
    private List<TemplateSection> sections;

    /**
     * ===== 旧版：Puck layout 数据 =====
     * @deprecated 保留用于向下兼容，新版模板请使用 sections 字段。
     */
    @Deprecated
    private ResumeLayout.LayoutData layoutData;

    private List<String> tags;

    private Integer usageCount = 0;

    @Indexed
    private String userId; // null 表示系统模板

    private Boolean isOfficial = false;

    private Date createdAt;
}
