package com.resumebuilder.controller;

import com.resumebuilder.dto.ApiResponse;
import com.resumebuilder.dto.LayoutRequest;
import com.resumebuilder.entity.ResumeLayout;
import com.resumebuilder.service.LayoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/layouts")
@RequiredArgsConstructor
public class LayoutController {

    private final LayoutService layoutService;

    @GetMapping
    public ApiResponse<List<ResumeLayout>> getUserLayouts(Authentication authentication) {
        String userId = authentication.getName();
        return ApiResponse.success(layoutService.getUserLayouts(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<ResumeLayout> getLayout(Authentication authentication, @PathVariable String id) {
        String userId = authentication.getName();
        return ApiResponse.success(layoutService.getLayout(userId, id));
    }

    @PostMapping
    public ApiResponse<ResumeLayout> saveLayout(Authentication authentication,
                                                 @RequestBody LayoutRequest request) {
        String userId = authentication.getName();
        ResumeLayout layout = layoutService.saveLayout(userId, request.getName(), request.getLayoutData());
        return ApiResponse.success("保存成功", layout);
    }

    @PutMapping("/{id}")
    public ApiResponse<ResumeLayout> updateLayout(Authentication authentication,
                                                   @PathVariable String id,
                                                   @RequestBody LayoutRequest request) {
        String userId = authentication.getName();
        ResumeLayout layout = layoutService.updateLayout(userId, id, request.getName(), request.getLayoutData());
        return ApiResponse.success("更新成功", layout);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteLayout(Authentication authentication, @PathVariable String id) {
        String userId = authentication.getName();
        layoutService.deleteLayout(userId, id);
        return ApiResponse.success("删除成功", null);
    }
}
