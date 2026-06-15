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

    private String wordTemplateKey; // 例如 tech_blue.docx

    private ResumeLayout.LayoutData layoutData;

    private List<String> tags;

    private Integer usageCount = 0;

    @Indexed
    private String userId; // null 表示系统模板

    private Boolean isOfficial = false;

    private Date createdAt;
}
