package com.resumebuilder.config;

import com.hankcs.hanlp.HanLP;
import com.hankcs.hanlp.dictionary.CustomDictionary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * HanLP 初始化配置：加载自定义词典和停用词表
 * 使用 HanLP 1.x portable 版本
 */
@Component
public class HanlpConfig implements CommandLineRunner {

    @Value("${hanlp.custom-dict}")
    private Resource customDictResource;

    @Override
    public void run(String... args) throws Exception {
        int count = 0;
        // 加载自定义词典
        if (customDictResource.exists()) {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(customDictResource.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (!line.isEmpty() && !line.startsWith("#")) {
                        CustomDictionary.add(line);
                        count++;
                    }
                }
            }
        }

        System.out.println("[HanLP] 自定义词典加载完成，共 " + count + " 个词条");
    }
}
