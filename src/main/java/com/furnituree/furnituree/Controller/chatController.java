package com.furnituree.furnituree.Controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.furnituree.furnituree.model.chatMessage;

@Controller
public class chatController {
    private final SimpMessagingTemplate messagingTemplate;

    public chatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send")
    public void sendMessage(chatMessage message) {
        String sender = safe(message.getSender(), "guest");
        String roomId = safe(message.getRoomId(), sender);
        message.setSender(sender);
        message.setRoomId(roomId);
        message.setType(chatMessage.MessageType.CHAT);

        // Message stream for the selected customer-admin room.
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, message);

        // Admin receives a notification whenever a customer sends a message.
        if (!"admin".equalsIgnoreCase(sender) && !"manager".equalsIgnoreCase(sender)) {
            chatMessage notification = new chatMessage();
            notification.setSender(sender);
            notification.setRecipient("admin");
            notification.setRoomId(roomId);
            notification.setType(chatMessage.MessageType.NOTIFICATION);
            notification.setContent(sender + " wants to chat");
            messagingTemplate.convertAndSend("/topic/admin/chat-notifications", notification);
        }
    }

    @MessageMapping("/chat.adminSend")
    public void adminSend(chatMessage message) {
        String recipient = safe(message.getRecipient(), message.getRoomId());
        String roomId = safe(message.getRoomId(), recipient);
        message.setSender(safe(message.getSender(), "admin"));
        message.setRecipient(recipient);
        message.setRoomId(roomId);
        message.setType(chatMessage.MessageType.CHAT);
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, message);
    }

    @MessageMapping("/chat.join")
    public void addUser(chatMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String sender = safe(message.getSender(), "guest");
        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("username", sender);
        }
        String roomId = safe(message.getRoomId(), sender);
        message.setSender(sender);
        message.setRoomId(roomId);
        message.setType(chatMessage.MessageType.JOIN);
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, message);
    }

    private String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
