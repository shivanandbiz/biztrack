frappe.pages['live-screens'].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Live Employee Screens',
        single_column: true
    });

    // Load required libraries
    frappe.require([
        '/assets/biztrack/js/socket.io.min.js',
        '/assets/biztrack/js/simplepeer.min.js'
    ], () => {
        new LiveScreensView(page);
    });
};

class LiveScreensView {
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
        const html = `
            <style>
                .employee-list-item {
                    cursor: pointer;
                    padding: 12px;
                    border-bottom: 1px solid #e0e0e0;
                    transition: background 0.2s;
                }
                .employee-list-item:hover {
                    background: #f5f5f5;
                }
                .employee-list-item.active {
                    background: #e3f2fd;
                    border-left: 4px solid #2196F3;
                }
                .status-indicator {
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    margin-right: 8px;
                }
                .status-online { background: #4CAF50; }
                .status-offline { background: #9E9E9E; }
                #remote-video {
                    width: 100%;
                    max-height: 70vh;
                    background: #000;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
            </style>
            <div class="row">
                <div class="col-md-3">
                    <h4>Available Employees</h4>
                    <div id="connection-status" style="padding: 10px; margin-bottom: 10px; border-radius: 4px; background: #f5f5f5;">
                        <small>Status: <span id="status-text">Connecting...</span></small>
                    </div>
                    <div id="employee-list"></div>
                </div>
                <div class="col-md-9">
                    <div id="video-container">
                        <h4 id="stream-title">Select an employee to view their screen</h4>
                        <video id="remote-video" autoplay playsinline style="display: none; width: 100%; max-width: 1200px; height: auto; border: 2px solid #ddd; border-radius: 8px; background: #000;"></video>
                        <div id="stream-controls" style="margin-top: 15px; display: none;">
                            <button class="btn btn-danger btn-sm" id="stop-stream-btn">
                                <i class="fa fa-stop"></i> Stop Viewing
                            </button>
                            <span id="stream-status" class="text-muted" style="margin-left: 15px;"></span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $(this.page.body).html(html);

        $('#stop-stream-btn').click(() => this.stopViewing());
    }

    connectToSignaling() {
        console.log('[LiveView] Connecting to signaling server...');

        this.socket = io('http://164.52.192.194:5000', {
            transports: ['websocket'],
            reconnection: true
        });

        this.socket.on('connect', () => {
            console.log('[LiveView] ✅ Connected to signaling server');
            $('#status-text').text('Connected').css('color', '#4CAF50');
            $('#connection-status').css('background', '#E8F5E9');
        });

        this.socket.on('disconnect', () => {
            console.log('[LiveView] ⚠️ Disconnected from signaling server');
            $('#status-text').text('Disconnected').css('color', '#F44336');
            $('#connection-status').css('background', '#FFEBEE');
        });

        this.socket.on('streamer-available', (data) => {
            console.log('[LiveView] 📝 Streamer available:', data.employee_name);
            this.addEmployeeToList(data.employee_id, data.employee_name);
        });

        this.socket.on('offer', (data) => {
            console.log('[LiveView] 📨 Received offer from employee');
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

        console.log('[LiveView] 📹 Requesting stream from:', employeeName);

        // Request stream from employee
        this.socket.emit('request-stream', {
            employee_id: employeeId
        });
    }

    handleOffer(offer, fromId) {
        console.log('[LiveView] 📨 Creating peer connection...');

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
        console.log('[LiveView] ✅ Peer instance created');

        this.peer.on('signal', (answer) => {
            console.log('[LiveView] 📤 Sending answer to employee');
            this.socket.emit('answer', {
                target: fromId,
                answer: answer
            });
        });

        this.peer.on('connect', () => {
            console.log('[LiveView] 🔗 Peer connected!');
        });

        // Monitor ICE connection state
        if (this.peer._pc) {
            this.peer._pc.oniceconnectionstatechange = () => {
                console.log('[LiveView] 🧊 ICE connection state:', this.peer._pc.iceConnectionState);
            };
            this.peer._pc.onicegatheringstatechange = () => {
                console.log('[LiveView] 🧊 ICE gathering state:', this.peer._pc.iceGatheringState);
            };
        }

        this.peer.on('data', (data) => {
            console.log('[LiveView] 📦 Data received:', data);
        });

        this.peer.on('track', (track, stream) => {
            console.log('[LiveView] 🎬 Track received!', track.kind, track.readyState);
            console.log('[LiveView] 🎥 Stream from track:', stream);
            const video = document.getElementById('remote-video');
            video.srcObject = stream;
            video.play().catch(e => console.error('[LiveView] Video play error:', e));
        });

        this.peer.on('stream', (stream) => {
            console.log('[LiveView] ✅ Stream received! Displaying video...');
            console.log('[LiveView] Stream details:', {
                id: stream.id,
                active: stream.active,
                videoTracks: stream.getVideoTracks().length,
                audioTracks: stream.getAudioTracks().length
            });
            const video = document.getElementById('remote-video');
            video.srcObject = stream;
            video.style.display = 'block';
            video.play().catch(e => console.error('[LiveView] Video play error:', e));
            $('#stream-controls').show();
            $('#stream-status').text('🔴 Live streaming...').css('color', '#4CAF50');

            frappe.show_alert({
                message: `Now viewing ${this.currentEmployeeName}'s screen`,
                indicator: 'green'
            });
        });

        this.peer.on('error', (err) => {
            console.error('[LiveView] ❌ Peer error:', err);
            console.error('[LiveView] ❌ Error details:', err.message, err.code);
            $('#stream-status').text('Connection error').css('color', '#F44336');
            frappe.msgprint({
                title: 'Connection Error',
                message: 'Failed to establish video connection. Please try again.',
                indicator: 'red'
            });
        });

        this.peer.on('close', () => {
            console.log('[LiveView] 🔌 Peer connection closed');
            this.stopViewing();
        });

        console.log('[LiveView] 📨 Signaling offer to peer...');
        this.peer.signal(offer);
        console.log('[LiveView] ✅ Offer signaled');
    }

    stopViewing() {
        console.log('[LiveView] ⏹️ Stopping stream...');

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
