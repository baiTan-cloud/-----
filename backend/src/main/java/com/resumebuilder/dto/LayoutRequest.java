package com.resumebuilder.dto;

import com.resumebuilder.entity.ResumeLayout;
import lombok.Data;

@Data
public class LayoutRequest {
    private String name;
    private ResumeLayout.LayoutData layoutData;
}
