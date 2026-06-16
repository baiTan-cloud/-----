package com.resumebuilder.controller;

import com.resumebuilder.dto.ApiResponse;
import com.resumebuilder.entity.DailyRecord;
import com.resumebuilder.entity.Template;
import com.resumebuilder.entity.User;
import com.resumebuilder.repository.DailyRecordRepository;
import com.resumebuilder.service.AuthService;
import com.resumebuilder.service.TemplateRenderEngine;
import com.resumebuilder.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 模板渲染 API
 * 使用新模板模型（sections + contentTemplate + 占位符）进行渲染
 */
@RestController
@RequestMapping("/api/v1/render")
@RequiredArgsConstructor
public class RenderController {

    private final TemplateRenderEngine renderEngine;
    private final TemplateService templateService;
    private final AuthService authService;
    private final DailyRecordRepository recordRepository;

    /**
     * 渲染模板，返回渲染结果。
     * 用于模板编辑器的实时预览（也可由前端调用验证渲染效果）
     */
    @PostMapping("/template/{templateId}")
    public ApiResponse<TemplateRenderEngine.RenderResult> renderTemplate(
            Authentication authentication,
            @PathVariable String templateId) {
        String userId = authentication.getName();
        Template template = templateService.getTemplate(templateId);
        User user = authService.getUserById(userId);
        List<DailyRecord> records = recordRepository.findByUserIdAndDeletedFalse(userId);

        TemplateRenderEngine.RenderResult result = renderEngine.render(template, user, records);
        return ApiResponse.success(result);
    }
}
