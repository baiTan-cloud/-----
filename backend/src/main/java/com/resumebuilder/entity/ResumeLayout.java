package com.resumebuilder.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.Map;

@Data
@Document(collection = "resume_layouts")
public class ResumeLayout {
    @Id
    private String id;

    @Indexed
    private String userId;

    private String name;

    private LayoutData layoutData;

    private String templateId;

    private Boolean isPublicTemplate = false;

    private Date createdAt;

    private Date updatedAt;

    /**
     * 布局数据，使用 Puck 原生 JSON 格式
     * { root: { props: {} }, content: [{ type, props, id }] }
     */
    @Data
    public static class LayoutData {
        private Map<String, Object> puckData;
    }
}
