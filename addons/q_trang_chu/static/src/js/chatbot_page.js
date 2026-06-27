/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, useState, onMounted } from "@odoo/owl";

const actionRegistry = registry.category("actions");

/**
 * AI Chatbot - Full Screen Chat Interface
 */
class ChatbotPage extends Component {
    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        this.user = useService("user");

        this.state = useState({
            isTyping: false,
            messages: [],
            currentConversationId: null,
            inputValue: "",
            conversations: [],
            showSidebar: true,
        });

        this.welcomeOptions = [
            { icon: "📦", label: "Mượn tài sản", query: "Làm sao để mượn tài sản?", desc: "Hướng dẫn quy trình mượn trả" },
            { icon: "📅", label: "Kiểm tra lịch", query: "Tôi có thể mượn xe công ty ngày mai không?", desc: "Xem tài sản có sẵn" },
            { icon: "🔧", label: "Bảo hành", query: "Laptop của tôi còn bảo hành bao lâu?", desc: "Tra cứu thông tin bảo hành" },
            { icon: "📋", label: "Quy trình", query: "Quy trình thanh lý tài sản cũ như thế nào?", desc: "Giải thích các chính sách" },
        ];

        onMounted(() => {
            this.loadConversations();
            this.addWelcomeMessage();
        });
    }

    async loadConversations() {
        try {
            const conversations = await this.orm.searchRead(
                "chatbot.conversation",
                [["user_id", "=", this.user.userId]],
                ["id", "name", "create_date", "write_date"],
                { limit: 20, order: "write_date desc" }
            );
            this.state.conversations = conversations;
        } catch (error) {
            console.error("Error loading conversations:", error);
        }
    }

    addWelcomeMessage() {
        const userName = this.user.name || "bạn";
        this.state.messages.push({
            id: `welcome_${Date.now()}`,
            content: `Xin chào <strong>${userName}</strong>! 👋<br><br>Tôi là <strong>AI Assistant</strong> - trợ lý thông minh có thể giúp bạn:<br>• Hướng dẫn mượn/trả tài sản<br>• Kiểm tra lịch tài sản<br>• Tra cứu thông tin bảo hành<br>• Giải thích quy trình, quy định<br><br>Bạn cần hỗ trợ gì?`,
            isUser: false,
            timestamp: this.formatTime(new Date()),
            showOptions: true,
        });
    }

    async sendMessage(overrideMessage = null) {
        const message = overrideMessage || this.state.inputValue.trim();
        if (!message || this.state.isTyping) return;

        this.state.inputValue = "";

        this.state.messages.push({
            id: `user_${Date.now()}`,
            content: this.escapeHtml(message),
            isUser: true,
            timestamp: this.formatTime(new Date()),
        });
        this.scrollToBottom();

        this.state.isTyping = true;

        try {
            const response = await this.orm.call(
                "chatbot.assistant",
                "process_message",
                [message, this.state.currentConversationId]
            );

            this.state.currentConversationId = response.conversation_id;

            this.state.messages.push({
                id: `bot_${Date.now()}`,
                content: this.formatMarkdown(response.answer),
                isUser: false,
                timestamp: this.formatTime(new Date()),
                suggestions: response.suggestions || [],
                actions: response.actions || [],
            });

            this.loadConversations();

        } catch (error) {
            console.error("Chatbot error:", error);
            this.state.messages.push({
                id: `error_${Date.now()}`,
                content: "❌ Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
                isUser: false,
                timestamp: this.formatTime(new Date()),
            });
        } finally {
            this.state.isTyping = false;
            this.scrollToBottom();
        }
    }

    sendQuickOption(option) {
        this.sendMessage(option.query);
    }

    sendSuggestion(text) {
        this.sendMessage(text);
    }

    handleAction(action) {
        if (action.type === "link" && action.action) {
            try {
                this.action.doAction(action.action);
            } catch (e) {
                console.error("Action error:", e);
            }
        }
    }

    async loadConversation(conv) {
        this.state.currentConversationId = conv.id;
        this.state.messages = [];

        try {
            const messages = await this.orm.searchRead(
                "chatbot.message",
                [["conversation_id", "=", conv.id]],
                ["id", "content", "is_user", "create_date"],
                { order: "create_date asc" }
            );

            this.state.messages = messages.map(msg => ({
                id: msg.id,
                content: this.formatMarkdown(msg.content),
                isUser: msg.is_user,
                timestamp: this.formatTime(new Date(msg.create_date)),
            }));

            this.scrollToBottom();
        } catch (error) {
            console.error("Error loading conversation:", error);
        }
    }

    startNewConversation() {
        this.state.messages = [];
        this.state.currentConversationId = null;
        this.addWelcomeMessage();
    }

    toggleSidebar() {
        this.state.showSidebar = !this.state.showSidebar;
    }

    handleInput(event) {
        this.state.inputValue = event.target.value;
    }

    handleKeyPress(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            const el = document.querySelector(".o_chat_messages");
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        }, 100);
    }

    formatTime(date) {
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    formatMarkdown(text) {
        if (!text) return "";
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\n/g, "<br>");
    }

    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    get userName() {
        return this.user.name || "bạn";
    }
}

ChatbotPage.template = "q_trang_chu.ChatbotPage";

actionRegistry.add("q_trang_chu.chatbot_page", ChatbotPage);
