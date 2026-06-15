package com.resumebuilder.controller;

import com.resumebuilder.dto.ApiResponse;
import com.resumebuilder.entity.ResumeLayout;
import com.resumebuilder.entity.Template;
import com.resumebuilder.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    @GetMapping
    public ApiResponse<List<Template>> getTemplates(
            @RequestParam(required = false) List<String> tags) {
        return ApiResponse.success(templateService.getTemplates(tags));
    }

    @GetMapping("/{id}")
    public ApiResponse<Template> getTemplate(@PathVariable String id) {
        return ApiResponse.success(templateService.getTemplate(id));
    }

    @PostMapping("/{id}/use")
    public ApiResponse<ResumeLayout> useTemplate(Authentication authentication,
                                                  @PathVariable String id) {
        String userId = authentication.getName();
        ResumeLayout layout = templateService.useTemplate(userId, id);
        return ApiResponse.success("模板已应用", layout);
    }
}
