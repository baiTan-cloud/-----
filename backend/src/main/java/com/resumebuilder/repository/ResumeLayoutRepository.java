package com.resumebuilder.repository;

import com.resumebuilder.entity.ResumeLayout;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumeLayoutRepository extends MongoRepository<ResumeLayout, String> {
    List<ResumeLayout> findByUserIdOrderByUpdatedAtDesc(String userId);
}
