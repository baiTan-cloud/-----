package com.resumebuilder.config;

import com.resumebuilder.entity.ResumeLayout;
import com.resumebuilder.entity.Template;
import com.resumebuilder.entity.User;
import com.resumebuilder.repository.TemplateRepository;
import com.resumebuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * 开发环境种子数据初始化
 * 系统启动时自动插入演示数据（如果数据库为空）
 */
@Component
@Order(2)
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TemplateRepository templateRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 只在无用户时插入种子数据
        if (userRepository.count() > 0) {
            System.out.println("[Seed] 数据库已有数据，跳过种子初始化");
            return;
        }

        System.out.println("[Seed] 开始初始化种子数据...");
        createDemoUser();
        createOfficialTemplates();
        System.out.println("[Seed] 种子数据初始化完成");
    }

    private void createDemoUser() {
        User user = new User();
        user.setEmail("demo@example.com");
        user.setPassword(passwordEncoder.encode("123456"));
        user.setName("陈凯鑫");
        user.setCreatedAt(new Date());
        user.setUpdatedAt(new Date());
        userRepository.save(user);
        System.out.println("[Seed] 已创建演示用户: demo@example.com / 123456");
    }

    @SuppressWarnings("unchecked")
    private void createOfficialTemplates() {
        // 模板1：简约科技蓝
        Template t1 = new Template();
        t1.setName("简约科技蓝");
        t1.setWordTemplateKey("tech_blue.docx");
        t1.setTags(Arrays.asList("互联网", "简约"));
        t1.setUsageCount(0);
        t1.setIsOfficial(true);
        t1.setCreatedAt(new Date());
        t1.setLayoutData(makePuckLayout(List.of(
                puckComponent("comp-1", "HeadingBlock", mapOf(
                        "text", "姓名", "fontSize", 26, "bold", true,
                        "color", "#1890ff", "textAlign", "center", "binding", "user.name"
                )),
                puckComponent("comp-2", "TextBlock", mapOf(
                        "text", "邮箱 | 电话", "fontSize", 11, "color", "#595959",
                        "textAlign", "center", "binding", "user.email"
                )),
                puckComponent("comp-3", "ExperienceList", mapOf(
                        "title", "教育经历", "listType", "education",
                        "bold", true, "color", "#1890ff", "binding", "records[type=education]"
                )),
                puckComponent("comp-4", "ExperienceList", mapOf(
                        "title", "项目经历", "listType", "project",
                        "bold", true, "color", "#1890ff", "binding", "records[type=project]"
                ))
        )));
        templateRepository.save(t1);

        // 模板2：学术简洁
        Template t2 = new Template();
        t2.setName("学术简洁");
        t2.setWordTemplateKey("simple_elegant.docx");
        t2.setTags(Arrays.asList("教育", "简约"));
        t2.setUsageCount(0);
        t2.setIsOfficial(true);
        t2.setCreatedAt(new Date());
        t2.setLayoutData(makePuckLayout(List.of(
                puckComponent("comp-1", "HeadingBlock", mapOf(
                        "text", "姓名", "fontSize", 24, "bold", true,
                        "color", "#262626", "textAlign", "left", "binding", "user.name"
                )),
                puckComponent("comp-2", "Divider", mapOf()),
                puckComponent("comp-3", "ExperienceList", mapOf(
                        "title", "教育经历", "listType", "education",
                        "bold", true, "color", "#262626", "binding", "records[type=education]"
                ))
        )));
        templateRepository.save(t2);

        // 模板3：现代双栏
        Template t3 = new Template();
        t3.setName("现代双栏");
        t3.setWordTemplateKey("modern_dual.docx");
        t3.setTags(Arrays.asList("互联网", "现代"));
        t3.setUsageCount(0);
        t3.setIsOfficial(true);
        t3.setCreatedAt(new Date());
        t3.setLayoutData(makePuckLayout(List.of(
                puckComponent("comp-1", "HeadingBlock", mapOf(
                        "text", "姓名", "fontSize", 20, "bold", true,
                        "color", "#2f54eb", "textAlign", "center", "binding", "user.name"
                )),
                puckComponent("comp-2", "ExperienceList", mapOf(
                        "title", "项目经历", "listType", "project",
                        "bold", true, "color", "#2f54eb", "binding", "records[type=project]"
                ))
        )));
        templateRepository.save(t3);

        System.out.println("[Seed] 已创建 3 个官方模板");
    }

    /** 构建 Puck 布局数据 */
    private ResumeLayout.LayoutData makePuckLayout(List<Map<String, Object>> content) {
        ResumeLayout.LayoutData layout = new ResumeLayout.LayoutData();
        Map<String, Object> puckData = new LinkedHashMap<>();
        puckData.put("root", Map.of("props", Map.of()));
        puckData.put("content", content);
        layout.setPuckData(puckData);
        return layout;
    }

    /** 构建一个 Puck 组件条目 */
    private Map<String, Object> puckComponent(String id, String type, Map<String, Object> props) {
        Map<String, Object> comp = new LinkedHashMap<>();
        comp.put("id", id);
        comp.put("type", type);
        comp.put("props", props);
        return comp;
    }

    /** 类型安全的多字段 Map 构建 */
    private Map<String, Object> mapOf(Object... kvs) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kvs.length; i += 2) {
            m.put((String) kvs[i], kvs[i + 1]);
        }
        return m;
    }
}
