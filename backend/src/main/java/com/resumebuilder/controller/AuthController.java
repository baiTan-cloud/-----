package com.resumebuilder.controller;

import com.resumebuilder.dto.ApiResponse;
import com.resumebuilder.dto.AuthRequest;
import com.resumebuilder.entity.User;
import com.resumebuilder.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<Map<String, String>> register(@Valid @RequestBody AuthRequest.Register request) {
        Map<String, String> result = authService.register(request);
        return ApiResponse.success("注册成功", result);
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, String>> login(@Valid @RequestBody AuthRequest.Login request) {
        Map<String, String> result = authService.login(request);
        return ApiResponse.success("登录成功", result);
    }

    @GetMapping("/me")
    public ApiResponse<User> me(Authentication authentication) {
        String userId = authentication.getName();
        User user = authService.getUserById(userId);
        // 不返回密码
        user.setPassword(null);
        return ApiResponse.success(user);
    }
}
