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

    /** 创建新模板（含 sections） */
    @PostMapping
    public ApiResponse<Template> createTemplate(@RequestBody Template template) {
        Template saved = templateService.createTemplate(template);
        return ApiResponse.success("模板已创建", saved);
    }

    /** 更新模板（含 sections） */
    @PutMapping("/{id}")
    public ApiResponse<Template> updateTemplate(@PathVariable String id,
                                                 @RequestBody Template template) {
        Template saved = templateService.updateTemplate(id, template);
        return ApiResponse.success("模板已更新", saved);
    }

    /** 删除模板 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTemplate(@PathVariable String id) {
        templateService.deleteTemplate(id);
        return ApiResponse.success("已删除", null);
    }

    @PostMapping("/{id}/use")
    public ApiResponse<ResumeLayout> useTemplate(Authentication authentication,
                                                  @PathVariable String id) {
        String userId = authentication.getName();
        ResumeLayout layout = templateService.useTemplate(userId, id);
        return ApiResponse.success("模板已应用", layout);
    }
}
