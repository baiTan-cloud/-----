package com.resumebuilder.entity;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 模板节定义。
 * 每个模板由多个节(section)组成，每个节定义了数据来源、文案模板和样式。
 *
 * 节类型：
 *   - personal: 个人信息（绑定用户属性）
 *   - list: 列表段（绑定某一类型记录，每条记录重复渲染）
 */
@Data
public class TemplateSection {

    /** 节唯一标识 */
    private String id;

    /** 节类型：personal | list */
    private String type;

    /** 节名称（编辑用） */
    private String label;

    /**
     * 数据绑定。
     * personal 类型时：user.name / user.email / user.phone
     * list 类型时：记录类型 project / education / internship / skill / certification / competition / other
     */
    private String dataBinding;

    // ======================== 文案模板 ========================

    /**
     * 内容模板（用于 personal 类型）。
     * 支持 {{占位符}} 替换，例如 "{{name}} | {{email}}"
     * 可用占位符：name, email, phone — 对应 User 实体字段
     */
    private String contentTemplate;

    /**
     * 列表标题模板（用于 list 类型）。
     * 例如 "项目经历" — 纯文本，不支持占位符
     */
    private String titleTemplate;

    /**
     * 单条记录渲染模板（用于 list 类型）。
     * 支持 {{占位符}} 替换，占位符对应 DailyRecord 的字段名。
     * 例如 "作为{{role}}，主导了{{title}}的{{whatDone}}，最终{{outcome}}。"
     */
    private String itemTemplate;

    /**
     * 可选：额外详情模板（用于 list 类型，渲染在 itemTemplate 下方）。
     * 例如 "技术栈：{{skills}}"
     */
    private String detailTemplate;

    // ======================== 占位符配置 ========================

    /**
     * 当前节可用的占位符列表（给编辑器提示用）。
     * personal：["name", "email", "phone"]
     * list（记录通用）：["title", "role", "orgName", "whatDone", "challenge", "solution", "outcome", "skills", "startDate", "endDate"]
     * list（教育附加）：["major", "degree", "gpa"]
     */
    private List<String> availableFields;

    // ======================== 样式 ========================

    /** 样式配置，灵活键值对 */
    private Map<String, Object> style;

    /** 排序序号 */
    private Integer sortOrder;
}
