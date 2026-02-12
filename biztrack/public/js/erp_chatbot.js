// frappe.ready(function() {
//     // Prevent duplicate widget creation
//     if (document.getElementById("erp-chatbot")) {
//         console.log("✅ ERP Chatbot already loaded");
//         return;
//     }

    
//     // Prevent duplicate widget creation
//     if (document.getElementById("erp-chatbot")) {
//         console.log("✅ ERP Chatbot already loaded");
//         return;
//     }

//     // ========== STYLES ==========
//     const style = document.createElement("style");
//     style.innerHTML = `
//         @keyframes float {
//         0%, 100% { transform: translateY(0px); }
//         50% { transform: translateY(-10px); }
//         }
        
//         @keyframes pulse {
//         0%, 100% { opacity: 1; }
//         50% { opacity: 0.5; }
//         }
        
//         @keyframes glow {
//         0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
//         50% { box-shadow: 0 0 40px rgba(0, 255, 255, 0.8); }
//         }
        
//         @keyframes slideUp {
//         from { opacity: 0; transform: translateY(20px); }
//         to { opacity: 1; transform: translateY(0); }
//         }
        
//         @keyframes blink { 
//         0%, 80%, 100% { opacity: 0; } 
//         40% { opacity: 1; } 
//         }
        
//         @keyframes scanline {
//         0% { transform: translateY(-100%); }
//         100% { transform: translateY(100%); }
//         }
        
//         @keyframes rotate {
//         from { transform: rotate(0deg); }
//         to { transform: rotate(360deg); }
//         }

//         #erp-chatbot { 
//         position: fixed; 
//         bottom: 20px; 
//         right: 20px; 
//         z-index: 9999; 
//         font-family: 'Segoe UI', Arial, sans-serif; 
//         }
        
//         #chat-toggle { 
//         background: linear-gradient(135deg, #00ffff 0%, #0080ff 100%); 
//         color: #000; 
//         border-radius: 50%; 
//         width: 70px; 
//         height: 70px; 
//         font-size: 32px; 
//         border: 3px solid rgba(0, 255, 255, 0.6); 
//         cursor: pointer; 
//         box-shadow: 0 0 30px rgba(0, 255, 255, 0.6), 0 4px 12px rgba(0,0,0,0.4); 
//         transition: all 0.3s ease; 
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         animation: glow 2s infinite;
//         position: relative;
//         overflow: hidden;
//         }
        
//         #chat-toggle:before {
//         content: '';
//         position: absolute;
//         top: 0;
//         left: -100%;
//         width: 100%;
//         height: 100%;
//         background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
//         animation: scanline 2s infinite;
//         }
        
//         #chat-toggle:hover { 
//         transform: scale(1.15); 
//         box-shadow: 0 0 50px rgba(0, 255, 255, 0.9), 0 6px 20px rgba(0,0,0,0.5); 
//         }
        
//         #chat-box { 
//         display: none; 
//         position: absolute; 
//         bottom: 90px; 
//         right: 0; 
//         width: 900px; 
//         height: 600px; 
//         background: linear-gradient(135deg, rgba(10, 20, 40, 0.95) 0%, rgba(20, 30, 50, 0.95) 100%); 
//         border-radius: 20px; 
//         box-shadow: 0 0 50px rgba(0, 255, 255, 0.4), 0 8px 32px rgba(0,0,0,0.3); 
//         overflow: hidden; 
//         animation: slideUp 0.4s ease;
//         border: 2px solid rgba(0, 255, 255, 0.3);
//         backdrop-filter: blur(10px);
//         }
        
//         #chat-header { 
//         margin: 0; 
//         padding: 20px; 
//         background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(0, 128, 255, 0.2) 100%); 
//         color: #00ffff; 
//         font-size: 18px; 
//         font-weight: 600; 
//         text-align: center; 
//         display: flex; 
//         justify-content: space-between; 
//         align-items: center; 
//         border-bottom: 2px solid rgba(0, 255, 255, 0.3);
//         text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
//         }
        
//         #chat-close { 
//         background: rgba(255, 0, 0, 0.2); 
//         border: 2px solid rgba(255, 0, 100, 0.5); 
//         color: #ff0066; 
//         font-size: 24px; 
//         cursor: pointer; 
//         padding: 5px 12px; 
//         border-radius: 50%;
//         transition: all 0.3s;
//         width: 40px;
//         height: 40px;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         }
        
//         #chat-close:hover {
//         background: rgba(255, 0, 0, 0.4);
//         transform: rotate(90deg);
//         box-shadow: 0 0 20px rgba(255, 0, 100, 0.6);
//         }
        
//         #chat-content {
//         display: flex;
//         height: calc(100% - 80px);
//         }
        
//         #ai-visual-panel {
//         width: 50%;
//         padding: 20px;
//         display: flex;
//         flex-direction: column;
//         align-items: center;
//         justify-content: center;
//         position: relative;
//         background: linear-gradient(135deg, rgba(0, 20, 40, 0.5) 0%, rgba(0, 40, 80, 0.5) 100%);
//         border-right: 2px solid rgba(0, 255, 255, 0.2);
//         overflow: hidden;
//         }
        
//         .grid-background {
//         position: absolute;
//         top: 0;
//         left: 0;
//         width: 100%;
//         height: 100%;
//         background-image: 
//             linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
//             linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
//         background-size: 30px 30px;
//         opacity: 0.3;
//         }
        
//         #ai-face-container {
//         position: relative;
//         width: 280px;
//         height: 320px;
//         animation: float 3s ease-in-out infinite;
//         z-index: 2;
//         }
        
//         .ai-face {
//         width: 100%;
//         height: 100%;
//         background: linear-gradient(135deg, rgba(100, 150, 255, 0.2) 0%, rgba(0, 255, 255, 0.2) 100%);
//         border-radius: 50% 50% 45% 45%;
//         position: relative;
//         border: 2px solid rgba(0, 255, 255, 0.4);
//         box-shadow: 0 0 40px rgba(0, 255, 255, 0.3), inset 0 0 40px rgba(0, 255, 255, 0.1);
//         overflow: hidden;
//         }
        
//         .ai-face:before {
//         content: '';
//         position: absolute;
//         top: 0;
//         left: 0;
//         width: 100%;
//         height: 100%;
//         background: repeating-linear-gradient(
//             0deg,
//             transparent,
//             transparent 2px,
//             rgba(0, 255, 255, 0.03) 2px,
//             rgba(0, 255, 255, 0.03) 4px
//         );
//         animation: scanline 4s linear infinite;
//         }
        
//         .face-mesh {
//         position: absolute;
//         width: 100%;
//         height: 100%;
//         background-image: 
//             radial-gradient(circle at 35% 40%, rgba(0, 255, 255, 0.3) 1px, transparent 1px),
//             radial-gradient(circle at 65% 40%, rgba(0, 255, 255, 0.3) 1px, transparent 1px),
//             linear-gradient(90deg, transparent 48%, rgba(0, 255, 255, 0.2) 50%, transparent 52%),
//             linear-gradient(0deg, transparent 58%, rgba(0, 255, 255, 0.2) 60%, transparent 62%);
//         background-size: 10px 10px, 10px 10px, 100% 100%, 100% 100%;
//         opacity: 0.6;
//         }
        
//         .ai-glow {
//         position: absolute;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%);
//         width: 120%;
//         height: 120%;
//         border-radius: 50%;
//         background: radial-gradient(circle, rgba(0, 255, 255, 0.2) 0%, transparent 70%);
//         animation: pulse 2s ease-in-out infinite;
//         }
        
//         .voice-indicator {
//         position: absolute;
//         bottom: -40px;
//         left: 50%;
//         transform: translateX(-50%);
//         display: flex;
//         align-items: center;
//         gap: 15px;
//         background: rgba(0, 40, 80, 0.7);
//         padding: 12px 24px;
//         border-radius: 25px;
//         border: 2px solid rgba(0, 255, 255, 0.4);
//         box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
//         }
        
//         .mic-circle {
//         width: 50px;
//         height: 50px;
//         border-radius: 50%;
//         background: linear-gradient(135deg, #00ffff 0%, #0080ff 100%);
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         animation: pulse 1.5s ease-in-out infinite;
//         position: relative;
//         }
        
//         .mic-circle:before {
//         content: '';
//         position: absolute;
//         width: 70px;
//         height: 70px;
//         border-radius: 50%;
//         border: 2px solid rgba(0, 255, 255, 0.3);
//         animation: pulse 1.5s ease-in-out infinite 0.3s;
//         }
        
//         .mic-icon {
//         color: #000;
//         font-size: 24px;
//         }
        
//         .voice-text {
//         color: #00ffff;
//         font-size: 14px;
//         text-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
//         }
        
//         .chat-bubble {
//         position: absolute;
//         top: 60px;
//         left: 30px;
//         background: rgba(0, 100, 150, 0.4);
//         border: 2px solid rgba(0, 255, 255, 0.5);
//         border-radius: 15px;
//         padding: 12px 18px;
//         color: #00ffff;
//         font-size: 13px;
//         max-width: 200px;
//         box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
//         text-shadow: 0 0 5px rgba(0, 255, 255, 0.8);
//         }
        
//         .chat-bubble:after {
//         content: '';
//         position: absolute;
//         bottom: -10px;
//         left: 20px;
//         width: 0;
//         height: 0;
//         border-left: 10px solid transparent;
//         border-right: 10px solid transparent;
//         border-top: 10px solid rgba(0, 255, 255, 0.5);
//         }
        
//         .info-panels {
//         position: absolute;
//         top: 20px;
//         right: 20px;
//         display: flex;
//         flex-direction: column;
//         gap: 10px;
//         }
        
//         .mini-panel {
//         background: rgba(0, 40, 80, 0.6);
//         border: 1px solid rgba(0, 255, 255, 0.3);
//         border-radius: 8px;
//         padding: 8px 12px;
//         min-width: 120px;
//         color: #00ffff;
//         font-size: 11px;
//         box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
//         }
        
//         .mini-panel-title {
//         font-weight: 600;
//         margin-bottom: 4px;
//         text-shadow: 0 0 5px rgba(0, 255, 255, 0.8);
//         }
        
//         .mini-chart {
//         display: flex;
//         gap: 3px;
//         margin-top: 4px;
//         }
        
//         .chart-bar {
//         width: 8px;
//         background: linear-gradient(to top, #0080ff, #00ffff);
//         border-radius: 2px;
//         box-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
//         }
        
//         .progress-ring {
//         position: absolute;
//         top: 20px;
//         right: 20px;
//         width: 80px;
//         height: 80px;
//         }
        
//         .progress-circle {
//         fill: none;
//         stroke: rgba(0, 255, 255, 0.3);
//         stroke-width: 6;
//         }
        
//         .progress-circle-fill {
//         fill: none;
//         stroke: #00ffff;
//         stroke-width: 6;
//         stroke-dasharray: 220;
//         stroke-dashoffset: 55;
//         transform: rotate(-90deg);
//         transform-origin: 50% 50%;
//         filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.8));
//         animation: rotate 3s linear infinite;
//         }
        
//         .progress-text {
//         position: absolute;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%);
//         color: #00ffff;
//         font-size: 16px;
//         font-weight: 600;
//         text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
//         }
        
//         #chat-panel {
//         width: 50%;
//         display: flex;
//         flex-direction: column;
//         background: rgba(0, 10, 20, 0.6);
//         }
        
//         #chat-messages { 
//         flex: 1;
//         overflow-y: auto; 
//         font-size: 13px; 
//         padding: 20px; 
//         background: rgba(0, 10, 20, 0.4);
//         }
        
//         #chat-messages::-webkit-scrollbar { 
//         width: 8px; 
//         }
        
//         #chat-messages::-webkit-scrollbar-track {
//         background: rgba(0, 40, 80, 0.3);
//         }
        
//         #chat-messages::-webkit-scrollbar-thumb { 
//         background: linear-gradient(180deg, #00ffff 0%, #0080ff 100%); 
//         border-radius: 4px; 
//         box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
//         }
        
//         .msg-user { 
//         background: linear-gradient(135deg, rgba(0, 255, 255, 0.3) 0%, rgba(0, 128, 255, 0.3) 100%); 
//         color: #fff; 
//         padding: 12px 16px; 
//         border-radius: 15px 15px 0 15px; 
//         margin: 12px 0 12px auto; 
//         max-width: 80%; 
//         word-wrap: break-word; 
//         text-align: left; 
//         box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
//         border: 1px solid rgba(0, 255, 255, 0.4);
//         }
        
//         .msg-bot { 
//         background: rgba(0, 40, 80, 0.6); 
//         color: #00ffff; 
//         padding: 12px 16px; 
//         border-radius: 15px 15px 15px 0; 
//         margin: 12px auto 12px 0; 
//         max-width: 80%; 
//         word-wrap: break-word; 
//         box-shadow: 0 0 20px rgba(0, 255, 255, 0.2); 
//         line-height: 1.6;
//         border: 1px solid rgba(0, 255, 255, 0.3);
//         text-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
//         }
        
//         .msg-recording { 
//         background: linear-gradient(135deg, rgba(0, 255, 100, 0.3) 0%, rgba(0, 200, 150, 0.3) 100%); 
//         color: #00ff88; 
//         padding: 12px 16px; 
//         border-radius: 15px; 
//         margin: 12px 0 12px auto; 
//         max-width: 80%; 
//         font-style: italic; 
//         animation: pulse 1.5s infinite;
//         border: 1px solid rgba(0, 255, 100, 0.4);
//         box-shadow: 0 0 20px rgba(0, 255, 100, 0.3);
//         }
        
//         .msg-error { 
//         background: rgba(255, 0, 100, 0.3); 
//         color: #ff0066; 
//         padding: 12px 16px; 
//         border-radius: 15px 15px 15px 0; 
//         margin: 12px auto 12px 0; 
//         max-width: 80%;
//         border: 1px solid rgba(255, 0, 100, 0.5);
//         box-shadow: 0 0 20px rgba(255, 0, 100, 0.3);
//         }
        
//         .msg-loading { 
//         background: rgba(0, 40, 80, 0.6); 
//         color: #00ffff; 
//         padding: 12px 16px; 
//         border-radius: 15px 15px 15px 0; 
//         margin: 12px auto 12px 0; 
//         max-width: 80%; 
//         box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
//         border: 1px solid rgba(0, 255, 255, 0.3);
//         }
        
//         .loading-dots { 
//         display: inline-block; 
//         }
        
//         .loading-dots span { 
//         animation: blink 1.4s infinite both; 
//         }
        
//         .loading-dots span:nth-child(2) { 
//         animation-delay: 0.2s; 
//         }
        
//         .loading-dots span:nth-child(3) { 
//         animation-delay: 0.4s; 
//         }
        
//         #chat-input { 
//         display: flex; 
//         gap: 10px; 
//         padding: 20px; 
//         background: rgba(0, 20, 40, 0.8); 
//         border-top: 2px solid rgba(0, 255, 255, 0.3); 
//         }
        
//         #chat-input input { 
//         flex: 1; 
//         padding: 14px 18px; 
//         border: 2px solid rgba(0, 255, 255, 0.4); 
//         border-radius: 25px; 
//         font-size: 14px; 
//         outline: none; 
//         transition: all 0.3s;
//         background: rgba(0, 40, 80, 0.5);
//         color: #00ffff;
//         }
        
//         #chat-input input::placeholder {
//         color: rgba(0, 255, 255, 0.5);
//         }
        
//         #chat-input input:focus { 
//         border-color: #00ffff; 
//         box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
//         background: rgba(0, 40, 80, 0.7);
//         }
        
//         #chat-input button { 
//         padding: 14px 24px; 
//         border: 2px solid rgba(0, 255, 255, 0.4); 
//         background: linear-gradient(135deg, rgba(0, 255, 255, 0.3) 0%, rgba(0, 128, 255, 0.3) 100%); 
//         color: #00ffff; 
//         border-radius: 25px; 
//         cursor: pointer; 
//         font-weight: 600; 
//         transition: all 0.3s; 
//         font-size: 14px;
//         text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
//         }
        
//         #chat-input button:hover { 
//         background: linear-gradient(135deg, rgba(0, 255, 255, 0.5) 0%, rgba(0, 128, 255, 0.5) 100%); 
//         transform: translateY(-2px); 
//         box-shadow: 0 0 25px rgba(0, 255, 255, 0.5);
//         }
        
//         #chat-input button:active { 
//         transform: translateY(0); 
//         }
        
//         #voice-btn { 
//         background: linear-gradient(135deg, rgba(0, 255, 100, 0.3) 0%, rgba(0, 200, 150, 0.3) 100%); 
//         font-size: 18px; 
//         padding: 14px 20px;
//         border-color: rgba(0, 255, 100, 0.4);
//         color: #00ff88;
//         }
        
//         #voice-btn.recording { 
//         background: linear-gradient(135deg, rgba(255, 0, 100, 0.4) 0%, rgba(200, 0, 100, 0.4) 100%); 
//         animation: pulse 1s infinite;
//         border-color: rgba(255, 0, 100, 0.5);
//         color: #ff0066;
//         }
        
//         #voice-btn:hover { 
//         background: linear-gradient(135deg, rgba(0, 255, 100, 0.5) 0%, rgba(0, 200, 150, 0.5) 100%); 
//         box-shadow: 0 0 25px rgba(0, 255, 100, 0.5);
//         }
        
//         #voice-btn.recording:hover { 
//         background: linear-gradient(135deg, rgba(255, 0, 100, 0.6) 0%, rgba(200, 0, 100, 0.6) 100%); 
//         box-shadow: 0 0 25px rgba(255, 0, 100, 0.5);
//         }
//     `;
//     document.head.appendChild(style);

//     // ========== WIDGET HTML ==========
//     const widget = document.createElement("div");
//     widget.id = "erp-chatbot";
//     widget.innerHTML = `
//         <button id="chat-toggle" title="Open ERP Assistant">🤖</button>
//         <div id="chat-box">
//         <div id="chat-header">
//             <span>🤖 AI ERP Assistant - Quantum Interface</span>
//             <button id="chat-close" title="Close">×</button>
//         </div>
//         <div id="chat-content">
//             <div id="ai-visual-panel">
//             <div class="grid-background"></div>
            
//             <div class="chat-bubble">
//                 Hello! Now can to assist<br>with your quantum ERP?
//             </div>
            
//             <div class="info-panels">
//                 <div class="mini-panel">
//                 <div class="mini-panel-title">📊 Dashboard</div>
//                 <div class="mini-chart">
//                     <div class="chart-bar" style="height: 20px;"></div>
//                     <div class="chart-bar" style="height: 35px;"></div>
//                     <div class="chart-bar" style="height: 25px;"></div>
//                     <div class="chart-bar" style="height: 40px;"></div>
//                     <div class="chart-bar" style="height: 30px;"></div>
//                 </div>
//                 </div>
//                 <div class="mini-panel">
//                 <div class="mini-panel-title">💼 Business</div>
//                 <div style="color: rgba(0, 255, 255, 0.7); font-size: 10px; margin-top: 4px;">
//                     ▸ Revenue<br>
//                     ▸ Analytics<br>
//                     ▸ Reports
//                 </div>
//                 </div>
//             </div>
            
//             <div class="progress-ring">
//                 <svg width="80" height="80">
//                 <circle class="progress-circle" cx="40" cy="40" r="35"></circle>
//                 <circle class="progress-circle-fill" cx="40" cy="40" r="35"></circle>
//                 </svg>
//                 <div class="progress-text">AI</div>
//             </div>
            
//             <div id="ai-face-container">
//                 <div class="ai-glow"></div>
//                 <div class="ai-face">
//                 <div class="face-mesh">
//                     <img src="/files/ai_face.jpg" 
//                         alt="AI Face" 
//                         style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                
//                 </div>
//                 </div>
//                 <div class="voice-indicator">
//                 <div class="mic-circle">
//                     <div class="mic-icon">🎙</div>
//                 </div>
//                 <div>
//                     <div class="voice-text" style="font-weight: 600;">Voice Input</div>
//                     <div class="voice-text" style="font-size: 11px; opacity: 0.7;">Voice Command...</div>
//                 </div>
//                 </div>
//             </div>
//             </div>
            
//             <div id="chat-panel">
//             <div id="chat-messages">
//                 <div class="msg-bot">
//                 👋 <strong>Hi! I'm your ERP Assistant.</strong><br><br>
//                 <strong>📊 Business Analytics:</strong><br>
//                 • Today's total business<br>
//                 • Fastest selling product<br>
//                 • Branch-wise business<br>
//                 • Highest revenue branch<br><br>
//                 <strong>🎯 CRM Analytics:</strong><br>
//                 • Event inquiries today<br>
//                 • Weekly opportunities<br>
//                 • Total quotations<br><br>
//                 <strong>📚 Course/Student Info:</strong><br>
//                 • Course enquiries<br>
//                 • Payment status<br>
//                 • Course fees<br><br>
//                 Just type or use voice! 🎙️
//                 </div>
//             </div>
//             <div id="chat-input">
//                 <input type="text" id="user-question" placeholder="Ask me anything..." autocomplete="off">
//                 <button id="send-btn" title="Send message">Send</button>
//                 <button id="voice-btn" title="Voice input">🎙️</button>
//             </div>
//             </div>
//         </div>
//         </div>
//     `;
//     document.body.appendChild(widget);

//     // ========== CONFIGURATION ==========
//     // IMPORTANT: Update this URL with your ngrok URL from the backend
//     const API_URL = "https://5cb36e5c646e.ngrok-free.app/ask";
//     // Example: const API_URL = "https://1d7555954e74.ngrok-free.app/ask";
    
//     // ========== DOM ELEMENTS ==========
//     const toggleBtn = document.getElementById("chat-toggle");
//     const chatBox = document.getElementById("chat-box");
//     const chatClose = document.getElementById("chat-close");
//     const messagesDiv = document.getElementById("chat-messages");
//     const sendBtn = document.getElementById("send-btn");
//     const inputField = document.getElementById("user-question");
//     const voiceBtn = document.getElementById("voice-btn");

//     // ========== UTILITY FUNCTIONS ==========
//     function sanitizeHtml(text) {
//         return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
//     }

//     function scrollToBottom() {
//         messagesDiv.scrollTop = messagesDiv.scrollHeight;
//     }

//     function addMessage(content, className) {
//         const msgDiv = document.createElement("div");
//         msgDiv.className = className;
//         msgDiv.innerHTML = content;
//         messagesDiv.appendChild(msgDiv);
//         scrollToBottom();
//         return msgDiv;
//     }

//     // ========== CHAT TOGGLE ==========
//     toggleBtn.addEventListener("click", () => {
//         const isHidden = chatBox.style.display === "none" || chatBox.style.display === "";
//         chatBox.style.display = isHidden ? "block" : "none";
//         if (isHidden) {
//             inputField.focus();
//         }
//     });

//     chatClose.addEventListener("click", () => {
//         chatBox.style.display = "none";
//     });

//     // ========== SEND QUESTION FUNCTION ==========
//     async function sendQuestion(question, isVoice = false) {
//         if (!question || (typeof question === 'string' && !question.trim())) {
//             console.warn("Empty question, ignoring");
//             return;
//         }
        
//         let loadingMsgId = null;
//         let loadingElement = null;
        
//         try {
//             // Show user message or voice indicator
//             if (isVoice) {
//                 const voiceMsg = addMessage("🎙️ Processing voice...", "msg-recording");
//                 loadingMsgId = "voice-processing-" + Date.now();
//                 voiceMsg.id = loadingMsgId;
//             } else {
//                 const sanitizedQuestion = sanitizeHtml(question);
//                 addMessage(sanitizedQuestion, "msg-user");
//             }

//             // Show loading indicator
//             loadingElement = addMessage(
//                 '<div class="loading-dots">Thinking<span>.</span><span>.</span><span>.</span></div>',
//                 "msg-loading"
//             );
//             loadingElement.id = "loading-msg-" + Date.now();

//             // Prepare request
//             const requestBody = isVoice 
//                 ? { audio_base64: question }
//                 : { question: question.trim() };

//             console.log("📤 Sending request to:", API_URL);
//             console.log("📦 Request body:", isVoice ? "Audio data" : requestBody);

//             // Send request with timeout
//             const controller = new AbortController();
//             const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

//             const response = await fetch(API_URL, {
//                 method: "POST",
//                 headers: { 
//                     "Content-Type": "application/json",
//                     "ngrok-skip-browser-warning": "true"
//                 },
//                 body: JSON.stringify(requestBody),
//                 signal: controller.signal
//             });

//             clearTimeout(timeoutId);

//             // Remove loading message
//             if (loadingElement && loadingElement.parentNode) {
//                 loadingElement.remove();
//             }

//             console.log("📥 Response status:", response.status);

//             if (!response.ok) {
//                 const errorText = await response.text();
//                 throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
//             }

//             const data = await response.json();
//             console.log("✅ Response data received:", data);

//             // Handle voice transcription
//             if (isVoice && data.transcribed_text && loadingMsgId) {
//                 const voiceElement = document.getElementById(loadingMsgId);
//                 if (voiceElement) {
//                     voiceElement.className = "msg-user";
//                     voiceElement.id = "";
//                     const sanitizedText = sanitizeHtml(data.transcribed_text);
//                     voiceElement.innerHTML = `🎙️ ${sanitizedText}`;
//                 }
//             }

//             // Show bot response
//             if (data.text_response) {
//                 const sanitizedResponse = sanitizeHtml(data.text_response);
//                 addMessage(sanitizedResponse, "msg-bot");
//             } else {
//                 addMessage("⚠️ No response received from server", "msg-error");
//             }

//             // Play audio response
//             if (data.audio_base64) {
//                 try {
//                     const audio = new Audio("data:audio/mp3;base64," + data.audio_base64);
//                     await audio.play();
//                     console.log("🔊 Audio played successfully");
//                 } catch (audioErr) {
//                     console.warn("⚠️ Audio playback failed:", audioErr);
//                 }
//             }

//             // Show success alert
//             frappe.show_alert({
//                 message: "Response received",
//                 indicator: "green"
//             }, 2);

//         } catch (err) {
//             console.error("❌ Error sending question:", err);
            
//             // Remove loading message if present
//             if (loadingElement && loadingElement.parentNode) {
//                 loadingElement.remove();
//             }
            
//             // Determine error message
//             let errorMsg = "Connection error. Please check the server.";
            
//             if (err.name === 'AbortError') {
//                 errorMsg = "Request timeout. Please try again.";
//             } else if (err.message.includes("Failed to fetch")) {
//                 errorMsg = "Cannot connect to server. Please verify the API URL is correct.";
//             } else if (err.message.includes("Server error")) {
//                 errorMsg = err.message;
//             }
            
//             // Update voice processing message if voice input
//             if (isVoice && loadingMsgId) {
//                 const voiceElement = document.getElementById(loadingMsgId);
//                 if (voiceElement) {
//                     voiceElement.className = "msg-error";
//                     voiceElement.id = "";
//                     voiceElement.innerHTML = `⚠️ ${errorMsg}`;
//                 }
//             } else {
//                 addMessage(`⚠️ ${errorMsg}`, "msg-error");
//             }
            
//             // Show error alert
//             frappe.show_alert({
//                 message: errorMsg,
//                 indicator: "red"
//             }, 5);
//         }
        
//         // Clear input field
//         if (!isVoice) {
//             inputField.value = "";
//         }
//     }

//     // ========== TEXT INPUT HANDLERS ==========
//     sendBtn.addEventListener("click", () => {
//         const question = inputField.value.trim();
//         if (question) {
//             sendQuestion(question);
//         }
//     });

//     inputField.addEventListener("keydown", (e) => { 
//         if (e.key === "Enter" && !e.shiftKey) {
//             e.preventDefault();
//             const question = inputField.value.trim();
//             if (question) {
//                 sendQuestion(question);
//             }
//         }
//     });

//     // ========== VOICE RECORDING ==========
//     let mediaRecorder = null;
//     let audioChunks = [];
//     let recordingTimeout = null;

//     function resetVoiceButton() {
//         voiceBtn.textContent = "🎙️";
//         voiceBtn.classList.remove("recording");
//         voiceBtn.title = "Voice input";
        
//         // Stop all media tracks
//         if (mediaRecorder && mediaRecorder.stream) {
//             mediaRecorder.stream.getTracks().forEach(track => track.stop());
//         }
//     }

//     voiceBtn.addEventListener("click", async () => {
//         // Stop recording
//         if (mediaRecorder && mediaRecorder.state === "recording") {
//             mediaRecorder.stop();
//             return;
//         }

//         // Start recording
//         if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//             frappe.show_alert({
//                 message: "Audio recording not supported in this browser!",
//                 indicator: "red"
//             });
//             return;
//         }
        
//         try {
//             console.log("🎙️ Starting audio recording...");
            
//             const stream = await navigator.mediaDevices.getUserMedia({ 
//                 audio: {
//                     echoCancellation: true,
//                     noiseSuppression: true,
//                     sampleRate: 44100
//                 } 
//             });
            
//             mediaRecorder = new MediaRecorder(stream, {
//                 mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
//             });
//             audioChunks = [];
            
//             mediaRecorder.ondataavailable = e => {
//                 if (e.data.size > 0) {
//                     audioChunks.push(e.data);
//                     console.log("📦 Audio chunk received:", e.data.size, "bytes");
//                 }
//             };
            
//             mediaRecorder.onstop = async () => {
//                 console.log("⏹️ Recording stopped");
//                 clearTimeout(recordingTimeout);
                
//                 if (audioChunks.length === 0) {
//                     frappe.show_alert({
//                         message: "No audio recorded. Please try again.",
//                         indicator: "orange"
//                     });
//                     resetVoiceButton();
//                     return;
//                 }
                
//                 const audioBlob = new Blob(audioChunks, { 
//                     type: mediaRecorder.mimeType 
//                 });
                
//                 console.log("🎵 Audio blob created:", audioBlob.size, "bytes");
                
//                 // Check if audio is too short
//                 if (audioBlob.size < 5000) {
//                     frappe.show_alert({
//                         message: "Recording too short. Please speak for at least 1 second.",
//                         indicator: "orange"
//                     });
//                     resetVoiceButton();
//                     return;
//                 }
                
//                 // Convert to base64
//                 const reader = new FileReader();
//                 reader.onloadend = () => {
//                     const base64data = reader.result.split(',')[1];
//                     console.log("📤 Sending audio data...");
//                     sendQuestion(base64data, true);
//                 };
//                 reader.onerror = (err) => {
//                     console.error("❌ FileReader error:", err);
//                     frappe.show_alert({
//                         message: "Failed to process audio",
//                         indicator: "red"
//                     });
//                 };
//                 reader.readAsDataURL(audioBlob);
                
//                 resetVoiceButton();
//             };
            
//             mediaRecorder.onerror = (err) => {
//                 console.error("❌ MediaRecorder error:", err);
//                 frappe.show_alert({
//                     message: "Recording error: " + (err.error ? err.error.message : "Unknown error"),
//                     indicator: "red"
//                 });
//                 resetVoiceButton();
//             };
            
//             // Start recording
//             mediaRecorder.start();
//             voiceBtn.textContent = "⏹️";
//             voiceBtn.classList.add("recording");
//             voiceBtn.title = "Stop recording";
            
//             console.log("✅ Recording started");
            
//             frappe.show_alert({
//                 message: "Recording... Click again to stop",
//                 indicator: "blue"
//             }, 3);
            
//             // Auto-stop after 30 seconds
//             recordingTimeout = setTimeout(() => {
//                 if (mediaRecorder && mediaRecorder.state === "recording") {
//                     console.log("⏰ Auto-stopping recording (30s limit)");
//                     mediaRecorder.stop();
//                     frappe.show_alert({
//                         message: "Recording stopped (30 second limit)",
//                         indicator: "blue"
//                     });
//                 }
//             }, 30000);
            
//         } catch (err) {
//             console.error("❌ Microphone access error:", err);
            
//             let errorMsg = "Cannot access microphone. ";
//             if (err.name === "NotAllowedError") {
//                 errorMsg += "Please allow microphone permissions in your browser.";
//             } else if (err.name === "NotFoundError") {
//                 errorMsg += "No microphone found on your device.";
//             } else if (err.name === "NotReadableError") {
//                 errorMsg += "Microphone is already in use by another application.";
//             } else {
//                 errorMsg += err.message;
//             }
            
//             frappe.show_alert({
//                 message: errorMsg,
//                 indicator: "red"
//             }, 7);
            
//             resetVoiceButton();
//         }
//     });

//     // ========== AUTO-FOCUS INPUT ==========
//     const observer = new MutationObserver((mutations) => {
//         mutations.forEach((mutation) => {
//             if (mutation.attributeName === "style") {
//                 if (chatBox.style.display === "block") {
//                     setTimeout(() => inputField.focus(), 100);
//                 }
//             }
//         });
//     });
//     observer.observe(chatBox, { attributes: true });

//     // ========== INITIALIZATION COMPLETE ==========
//     console.log("✅ ERP Chatbot loaded successfully!");
//     console.log("📡 API URL:", API_URL);
//     console.log("🎯 Features: Business Analytics, CRM Analytics, Course/Student Data");
    
//     // Show success notification
//     frappe.show_alert({
//         message: "ERP Assistant ready! Click the chat button to start.",
//         indicator: "green"
//     }, 3);
    
// });
