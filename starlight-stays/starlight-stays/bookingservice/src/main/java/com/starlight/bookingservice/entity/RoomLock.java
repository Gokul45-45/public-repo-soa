package com.starlight.bookingservice.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "room_locks")
public class RoomLock {

    @Id
    private Long roomId;

    private LocalDateTime lastLockedAt;

    public RoomLock() {
    }

    public RoomLock(Long roomId, LocalDateTime lastLockedAt) {
        this.roomId = roomId;
        this.lastLockedAt = lastLockedAt;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public LocalDateTime getLastLockedAt() {
        return lastLockedAt;
    }

    public void setLastLockedAt(LocalDateTime lastLockedAt) {
        this.lastLockedAt = lastLockedAt;
    }
}
