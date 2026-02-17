// activity_dashboard.js

frappe.pages['activity-dashboard'].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Activity Dashboard',
        single_column: true
    });

    // Load required libraries
    frappe.require([
        '/assets/biztrack/js/socket.io.min.js',
        '/assets/biztrack/js/simplepeer.min.js'
    ], () => {
        new ActivityDashboard(page);
    });
};

class ActivityDashboard {
    constructor(page) {
        this.page = page;
        this.socket = null;
        this.peer = null;
        this.currentEmployee = null;
        this.currentEmployeeName = null;

        this.setupUI();
        this.connectToSignaling();
    }

    setupUI() {
        // HTML is already loaded from activity_dashboard.html (assuming standard Frappe page load)
        // Bind Stop button
        $('#stop-stream-btn').click(() => this.stopViewing());
    }

    connectToSignaling() {
        console.log('[ActivityDashboard] Connecting to signaling server...');

        this.socket = io('http://164.52.192.194:5000', {
            transports: ['websocket'],
            reconnection: true
        });

        this.socket.on('connect', () => {
            console.log('[ActivityDashboard] ✅ Connected to signaling server');
            $('#status-text').text('Connected').css('color', '#4CAF50');
            $('#connection-status').css('background', '#E8F5E9');
        });

        this.socket.on('disconnect', () => {
            console.log('[ActivityDashboard] ⚠️ Disconnected from signaling server');
            $('#status-text').text('Disconnected').css('color', '#F44336');
            $('#connection-status').css('background', '#FFEBEE');
        });

        this.socket.on('streamer-available', (data) => {
            console.log('[ActivityDashboard] 📝 Streamer available:', data.employee_name);
            this.addEmployeeToList(data.employee_id, data.employee_name);
        });

        this.socket.on('offer', (data) => {
            console.log('[ActivityDashboard] 📨 Received offer from employee');
            this.handleOffer(data.offer, data.from);
        });

        this.socket.on('ice-candidate', (data) => {
            if (this.peer) {
                this.peer.signal(data.candidate);
            }
        });

        this.socket.on('stream-error', (data) => {
            frappe.msgprint({
                title: 'Stream Error',
                message: data.message,
                indicator: 'red'
            });
        });
    }

    addEmployeeToList(employeeId, employeeName) {
        const existing = $(`#employee-list .employee-list-item[data-id="${employeeId}"]`);
        if (existing.length === 0) {
            const html = `
                <div class="employee-list-item" data-id="${employeeId}">
                    <span class="status-indicator status-online"></span>
                    <strong>${employeeName}</strong>
                </div>
            `;
            $('#employee-list').append(html);

            $(`.employee-list-item[data-id="${employeeId}"]`).click(() => {
                this.startViewing(employeeId, employeeName);
            });
        }
    }

    startViewing(employeeId, employeeName) {
        if (this.currentEmployee) {
            this.stopViewing();
        }

        this.currentEmployee = employeeId;
        this.currentEmployeeName = employeeName;

        // Update UI
        $('.employee-list-item').removeClass('active');
        $(`.employee-list-item[data-id="${employeeId}"]`).addClass('active');

        $('#stream-title').text(`Live View: ${employeeName}`);
        $('#stream-status').text('Connecting...');

        console.log('[ActivityDashboard] 📹 Requesting stream from:', employeeName);

        // Request stream from employee
        this.socket.emit('request-stream', {
            employee_id: employeeId
        });
    }

    handleOffer(offer, fromId) {
        console.log('[ActivityDashboard] 📨 Creating peer connection...');

        // Create peer connection to receive stream
        this.peer = new SimplePeer({
            initiator: false,
            trickle: true,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    {
                        urls: 'turn:openrelay.metered.ca:80',
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    }
                ]
            }
        });
        console.log('[ActivityDashboard] ✅ Peer instance created');

        this.peer.on('signal', (answer) => {
            console.log('[ActivityDashboard] 📤 Sending answer to employee');
            this.socket.emit('answer', {
                target: fromId,
                answer: answer
            });
        });

        this.peer.on('connect', () => {
            console.log('[ActivityDashboard] 🔗 Peer connected!');
        });

        // Monitor ICE connection state
        if (this.peer._pc) {
            this.peer._pc.oniceconnectionstatechange = () => {
                console.log('[ActivityDashboard] 🧊 ICE connection state:', this.peer._pc.iceConnectionState);
            };
            this.peer._pc.onicegatheringstatechange = () => {
                console.log('[ActivityDashboard] 🧊 ICE gathering state:', this.peer._pc.iceGatheringState);
            };
        }

        this.peer.on('data', (data) => {
            console.log('[ActivityDashboard] 📦 Data received:', data);
        });

        this.peer.on('track', (track, stream) => {
            console.log('[ActivityDashboard] 🎬 Track received!', track.kind, track.readyState);
            console.log('[ActivityDashboard] 🎥 Stream from track:', stream);
            const video = document.getElementById('remote-video');
            video.srcObject = stream;
            video.play().catch(e => console.error('[ActivityDashboard] Video play error:', e));
        });

        this.peer.on('stream', (stream) => {
            console.log('[ActivityDashboard] ✅ Stream received! Displaying video...');
            console.log('[ActivityDashboard] Stream details:', {
                id: stream.id,
                active: stream.active,
                videoTracks: stream.getVideoTracks().length,
                audioTracks: stream.getAudioTracks().length
            });
            const video = document.getElementById('remote-video');
            video.srcObject = stream;
            video.style.display = 'block';
            video.play().catch(e => console.error('[ActivityDashboard] Video play error:', e));
            $('#stream-controls').show();
            $('#stream-status').text('🔴 Live streaming...').css('color', '#4CAF50');

            frappe.show_alert({
                message: `Now viewing ${this.currentEmployeeName}'s screen`,
                indicator: 'green'
            });
        });

        this.peer.on('error', (err) => {
            console.error('[ActivityDashboard] ❌ Peer error:', err);
            console.error('[ActivityDashboard] ❌ Error details:', err.message, err.code);
            $('#stream-status').text('Connection error').css('color', '#F44336');
            frappe.msgprint({
                title: 'Connection Error',
                message: 'Failed to establish video connection. Please try again.',
                indicator: 'red'
            });
        });

        this.peer.on('close', () => {
            console.log('[ActivityDashboard] 🔌 Peer connection closed');
            this.stopViewing();
        });

        console.log('[ActivityDashboard] 📨 Signaling offer to peer...');
        this.peer.signal(offer);
        console.log('[ActivityDashboard] ✅ Offer signaled');
    }

    stopViewing() {
        console.log('[ActivityDashboard] ⏹️ Stopping stream...');

        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        if (this.currentEmployee) {
            this.socket.emit('stop-stream', {
                employee_id: this.currentEmployee
            });
        }

        const video = document.getElementById('remote-video');
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        video.style.display = 'none';

        $('#stream-controls').hide();
        $('#stream-title').text('Select an employee to view their screen');
        $('#stream-status').text('');

        $('.employee-list-item').removeClass('active');

        this.currentEmployee = null;
        this.currentEmployeeName = null;
    }
}