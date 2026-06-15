package com.resumebuilder.repository;

import com.resumebuilder.entity.DailyRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DailyRecordRepository extends MongoRepository<DailyRecord, String> {

    // 分页查询用户记录（未删除）
    Page<DailyRecord> findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(String userId, Pageable pageable);

    // 按类型筛选
    Page<DailyRecord> findByUserIdAndTypeAndDeletedFalse(String userId, String type, Pageable pageable);

    // 按标题/描述关键词模糊搜索
    @Query("{ 'userId': ?0, 'deleted': false, $or: [ { 'title': { $regex: ?1, $options: 'i' } }, { 'description': { $regex: ?1, $options: 'i' } } ] }")
    Page<DailyRecord> searchByKeyword(String userId, String keyword, Pageable pageable);

    // 按技能标签筛选
    Page<DailyRecord> findByUserIdAndSkillsInAndDeletedFalse(String userId, List<String> skills, Pageable pageable);

    // 获取用户所有未删除记录（用于分词分析）
    List<DailyRecord> findByUserIdAndDeletedFalse(String userId);

    // 统计用户各类型记录数量
    long countByUserIdAndDeletedFalse(String userId);
}
