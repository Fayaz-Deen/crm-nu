package com.crm.repository;

import com.crm.entity.UserGoogleToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserGoogleTokenRepository extends JpaRepository<UserGoogleToken, String> {

    Optional<UserGoogleToken> findByUserId(String userId);

    boolean existsByUserId(String userId);

    void deleteByUserId(String userId);

    @Query("SELECT t FROM UserGoogleToken t WHERE t.calendarSyncEnabled = true AND t.refreshToken IS NOT NULL")
    List<UserGoogleToken> findAllWithSyncEnabled();
}
