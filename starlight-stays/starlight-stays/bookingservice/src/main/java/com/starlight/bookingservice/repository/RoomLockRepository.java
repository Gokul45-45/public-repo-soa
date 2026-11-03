package com.starlight.bookingservice.repository;

import com.starlight.bookingservice.entity.RoomLock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface RoomLockRepository extends JpaRepository<RoomLock, Long> {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Modifying
    @Query(value = "INSERT IGNORE INTO room_locks (room_id, last_locked_at) VALUES (:roomId, NOW())", nativeQuery = true)
    void insertIfNotExists(@Param("roomId") Long roomId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RoomLock r WHERE r.roomId = :roomId")
    Optional<RoomLock> findByRoomIdForUpdate(@Param("roomId") Long roomId);
}
