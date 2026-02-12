// admin_dashboard.js

frappe.pages['admin-dashboard'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Admin Dashboard',
        single_column: true
    });
    
    // Initialize dashboard
    new AdminDashboard(page);
};

class AdminDashboard {
    constructor(page) {
        this.page = page;
        this.current_company = 'All';
        this.refresh_interval = null;
        this.chart_instances = {};
        this.current_view = 'default'; // default, charts
        this.init();
    }

    init() {
        this.setup_page();
        this.load_dashboard_data();
        this.setup_auto_refresh();
    }

    setup_page() {
        // Create dashboard HTML structure
        this.page.main.html(`
            <div class="dashboard-container">
                <div class="row">
                    <div class="col-md-8">
                        <div class="page-form">
                            <div class="form-group">
                                <label>Company Filter</label>
                                <select class="form-control company-filter" style="width: 300px;">
                                    <option value="">All Companies</option>
                                    <option value="Biztechnosys">Biztechnosys</option>
                                    <option value="Bizinfra">Bizinfra</option>
                                    <option value="CRM Doctor">CRM Doctor</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="view-toggle-buttons" style="margin-top: 25px;">
                            <button class="btn btn-primary view-toggle" data-view="default">Cards View</button>
                            <button class="btn btn-secondary view-toggle" data-view="charts">Charts View</button>
                        </div>
                    </div>
                </div>
                <div class="dashboard-content">
                    <!-- Dashboard content will be loaded here -->
                </div>
            </div>
        `);

        // Setup event listeners
        this.setup_events();
    }

    setup_events() {
        const self = this;
        
        // Company filter change
        this.page.main.find('.company-filter').on('change', function() {
            self.current_company = $(this).val();
            self.load_dashboard_data();
        });

        // View toggle buttons
        this.page.main.find('.view-toggle').on('click', function() {
            const view = $(this).data('view');
            self.current_view = view;
            
            // Update button states
            self.page.main.find('.view-toggle').removeClass('btn-primary').addClass('btn-secondary');
            $(this).removeClass('btn-secondary').addClass('btn-primary');
            
            // Re-render dashboard
            if (self.dashboard_data) {
                self.render_dashboard(self.dashboard_data);
            }
        });

        // Refresh button
        this.page.add_action_item(__('Refresh'), function() {
            self.load_dashboard_data();
        });
    }

    load_dashboard_data() {
        const self = this;
        
        frappe.call({
            method: 'biztrack.biztrack.page.admin_dashboard.admin_dashboard.get_dashboard_data',
            args: {
                company: this.current_company || null
            },
            callback: function(r) {
                if (r.message && !r.message.error) {
                    self.dashboard_data = r.message;
                    self.render_dashboard(r.message);
                } else {
                    frappe.msgprint(__('Error loading dashboard data'));
                }
            },
            error: function() {
                frappe.msgprint(__('Error loading dashboard data'));
            }
        });
    }

    render_dashboard(data) {
        // Destroy existing charts
        this.destroy_charts();
        
        const dashboard_html = this.current_view === 'charts' ? 
            this.build_charts_view(data) : this.build_dashboard_html(data);
        this.page.main.find('.dashboard-content').html(dashboard_html);
        
        // Initialize charts if in charts view
        if (this.current_view === 'charts') {
            this.initialize_charts(data);
        }
    }

    build_dashboard_html(data) {
        return `
            <div class="admin-dashboard" style="border: 2px solid #003366; padding: 15px; border-radius: 8px;">
                <!-- CRM Module -->
                <div class="row module-section" ${this.should_hide_crm() ? 'style="display:none;"' : ''}>
                    <div class="col-md-12">
                        <h3><i class="fa fa-users"></i> CRM Dashboard</h3>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <div class="metric-value">${data.crm.leads.new}</div>
                                    <div class="metric-label">New Leads</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <div class="metric-value">${data.crm.leads.qualified}</div>
                                    <div class="metric-label">Qualified Leads</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <div class="metric-value">${data.crm.leads.converted}</div>
                                    <div class="metric-label">Converted Leads</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <div class="metric-value">${data.crm.leads.lost}</div>
                                    <div class="metric-label">Lost Leads</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Selling Module -->
                <div class="row module-section" ${this.should_hide_crm() ? 'style="display:none;"' : ''}>
                    <div class="col-md-12">
                        <h3><i class="fa fa-shopping-cart"></i> Selling Dashboard</h3>
                        <div class="row">
                            <div class="col-md-4">
                                <div class="metric-card">
                                    <div class="metric-value">${data.crm.opportunities_value}</div>
                                    <div class="metric-label">New Opportunity</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="metric-card">
                                    <div class="metric-value">${data.crm.sales_order_value}</div>
                                    <div class="metric-label">Sales Order</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="metric-card">
                                    <div class="metric-value">${data.crm.target_achieved}</div>
                                    <div class="metric-label">Target</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Accounting Module -->
                <div class="row module-section">
                    <div class="col-md-12">
                        <h3><i class="fa fa-money"></i> Accounting Dashboard</h3>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <div class="metric-value">₹${this.format_currency(data.accounting.outstanding_amount)}</div>
                                    <div class="metric-label">Outstanding Amount</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <div class="metric-value">₹${this.format_currency(data.accounting.total_billed)}</div>
                                    <div class="metric-label">Total Billed</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <div class="metric-value">₹${this.format_currency(data.accounting.amount_received)}</div>
                                    <div class="metric-label">Amount Received</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <div class="metric-value">₹${this.format_currency(data.accounting.yet_to_receive)}</div>
                                    <div class="metric-label">Yet to Receive</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Activity Module -->
                <div class="row module-section">
                    <div class="col-md-12">
                        <h3><i class="fa fa-tasks"></i> Activity Dashboard</h3>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="metric-card status-green">
                                    <div class="metric-value">${data.activity.tasks.completed}</div>
                                    <div class="metric-label">Tasks Completed</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-card status-yellow">
                                    <div class="metric-value">${data.activity.tasks.pending}</div>
                                    <div class="metric-label">Tasks Pending</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-card">
                                    <div class="metric-value">${data.activity.quotations_count}</div>
                                    <div class="metric-label">Quotations</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-card status-green">
                                    <div class="metric-value">${data.activity.projects.active}</div>
                                    <div class="metric-label">Active Projects</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Status Alerts -->
                        <div class="alert-section">
                            <h4>Status Alerts</h4>
                            <div class="alert alert-danger">
                                <strong>Red Alert:</strong> ${data.activity.status_alerts.red} projects require Kalpesh Sir escalation
                            </div>
                            <div class="alert alert-warning">
                                <strong>Yellow Alert:</strong> ${data.activity.status_alerts.yellow} projects may need Kalpesh Sir involvement
                            </div>
                            <div class="alert alert-success">
                                <strong>Green Status:</strong> ${data.activity.status_alerts.green} projects proceeding well
                            </div>
                            
                        </div>
                    </div>
                </div>

                <!-- Service Contracts Module -->
                <div class="row module-section">
                    <div class="col-md-12">
                        <h3><i class="fa fa-file-text"></i> Service Contracts</h3>
                        <div class="row">
                            <div class="col-md-4">
                                <div class="metric-card status-red">
                                    <div class="metric-value">${data.contracts.expired_contracts}</div>
                                    <div class="metric-label">Expired Contracts</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="metric-card status-yellow">
                                    <div class="metric-value">${data.contracts.expiring_in_15_days}</div>
                                    <div class="metric-label">Expiring in 15 Days</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="metric-card status-green">
                                    <div class="metric-value">${data.contracts.active_contracts}</div>
                                    <div class="metric-label">Active Contracts</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Product Categories -->
                <div class="row module-section">
                    <div class="col-md-12">
                        <h3><i class="fa fa-cube"></i> Product Categories</h3>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="metric-card">
                                    <div class="metric-value">₹${this.format_currency(data.products.staffing_revenue)}</div>
                                    <div class="metric-label">Staffing Revenue</div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="metric-card">
                                    <div class="metric-value">₹${this.format_currency(data.products.crm_doctor_revenue)}</div>
                                    <div class="metric-label">CRM Doctor Revenue</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ToDo Dashboard -->
                <div class="row module-section">
                    <div class="col-md-12">
                        <h3><i class="fa fa-check-square"></i> ToDo Dashboard</h3>
                        <div class="row">
                            <div class="col-md-4">
                                <div class="metric-card status-yellow">
                                    <div class="metric-value">${data.todos.counts.open}</div>
                                    <div class="metric-label">Open ToDos</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="metric-card status-green">
                                    <div class="metric-value">${data.todos.counts.closed}</div>
                                    <div class="metric-label">Closed ToDos</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="metric-card status-red">
                                    <div class="metric-value">${data.todos.counts.cancelled}</div>
                                    <div class="metric-label">Cancelled ToDos</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- ToDo Records Table -->
                        <div class="records-section">
                            <h4>Recent ToDos (Last 30 Days) - ${data.todos.total_records} records</h4>
                            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                                <table class="table table-striped table-bordered">
                                    <thead style="position: sticky; top: 0; background: #f8f9fa; z-index: 10;">
                                        <tr>
                                            <th>Description</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Date</th>
                                            <th>Assigned To</th>
                                            <th>Employee Name</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.build_todo_rows(data.todos.records)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Activity Log Dashboard -->
                <div class="row module-section">
                    <div class="col-md-12">
                        <h3><i class="fa fa-history"></i> Activity Log Dashboard</h3>
                        <div class="row">
                            <div class="col-md-2">
                                <div class="metric-card">
                                    <div class="metric-value">${data.activity_log.counts.email}</div>
                                    <div class="metric-label">Success Login</div>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="metric-card">
                                    <div class="metric-value">${data.activity_log.counts.call}</div>
                                    <div class="metric-label">Failed Login</div>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="metric-card">
                                    <div class="metric-value">${data.activity_log.counts.meeting}</div>
                                    <div class="metric-label">Meetings</div>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="metric-card">
                                    <div class="metric-value">${data.activity_log.counts.comment}</div>
                                    <div class="metric-label">Comments</div>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="metric-card">
                                    <div class="metric-value">${data.activity_log.counts.other}</div>
                                    <div class="metric-label">Others</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Activity Log Records Table -->
                        <div class="records-section">
                            <h4>Recent Activity Logs (Last 7 Days) - ${data.activity_log.total_records} records</h4>
                            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                                <table class="table table-striped table-bordered">
                                    <thead style="position: sticky; top: 0; background: #f8f9fa; z-index: 10;">
                                        <tr>
                                            <th>Subject</th>
                                            <th>Type</th>
                                            <th>Reference</th>
                                            <th>User</th>
                                            <th>Employee Name</th>
                                            <th>Created</th>
                                            <th>Content</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.build_activity_log_rows(data.activity_log.records)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    build_todo_rows(todos) {
        if (!todos || todos.length === 0) {
            return '<tr><td colspan="7" class="text-center">No ToDo records found</td></tr>';
        }
        
        return todos.map(todo => `
            <tr>
                <td style="max-width: 200px; word-wrap: break-word;">${todo.description || '-'}</td>
                <td>
                    <span class="badge ${this.get_todo_status_class(todo.status)}">
                        ${todo.status || '-'}
                    </span>
                </td>
                <td>
                    <span class="badge ${this.get_priority_class(todo.priority)}">
                        ${todo.priority || 'Medium'}
                    </span>
                </td>
                <td>${todo.date ? frappe.datetime.str_to_user(todo.date) : '-'}</td>
                <td style="max-width: 150px; word-wrap: break-word;">${todo.allocated_to || '-'}</td>
                <td style="max-width: 150px; word-wrap: break-word;">${todo.employee_name || '-'}</td>
                <td>${todo.creation ? frappe.datetime.str_to_user(todo.creation) : '-'}</td>
            </tr>
        `).join('');
    }

    build_activity_log_rows(logs) {
        if (!logs || logs.length === 0) {
            return '<tr><td colspan="7" class="text-center">No Activity Log records found</td></tr>';
        }
        
        return logs.map(log => `
            <tr>
                <td style="max-width: 200px; word-wrap: break-word;">${log.subject || '-'}</td>
                <td>
                    <span class="badge ${this.get_activity_type_class(log.communication_type)}">
                        ${log.communication_type || 'Other'}
                    </span>
                </td>
                <td style="max-width: 150px; word-wrap: break-word;">
                    ${log.reference_doctype ? log.reference_doctype + ': ' + (log.reference_name || '') : '-'}
                </td>
                <td style="max-width: 120px; word-wrap: break-word;">${log.user || '-'}</td>
                <td style="max-width: 150px; word-wrap: break-word;">${log.employee_name || '-'}</td>
                <td>${log.creation ? frappe.datetime.str_to_user(log.creation) : '-'}</td>
                <td style="max-width: 250px; word-wrap: break-word;">
                    ${log.content ? (log.content.length > 100 ? log.content.substring(0, 100) + '...' : log.content) : '-'}
                </td>
            </tr>
        `).join('');
    }

    get_todo_status_class(status) {
        switch (status) {
            case 'Open': return 'badge-warning';
            case 'Closed': return 'badge-success';
            case 'Cancelled': return 'badge-danger';
            default: return 'badge-secondary';
        }
    }

    get_priority_class(priority) {
        switch (priority) {
            case 'High': return 'badge-danger';
            case 'Medium': return 'badge-warning';
            case 'Low': return 'badge-success';
            default: return 'badge-secondary';
        }
    }

    get_activity_type_class(type) {
        switch (type) {
            case 'Email': return 'badge-primary';
            case 'Call': return 'badge-success';
            case 'Meeting': return 'badge-info';
            case 'Comment': return 'badge-secondary';
            default: return 'badge-dark';
        }
    }

    build_charts_view(data) {
        return `
            <!-- CRM Charts -->
            <div class="row module-section" ${this.should_hide_crm() ? 'style="display:none;"' : ''}>
                <div class="col-md-12">
                    <h3><i class="fa fa-users"></i> CRM Dashboard - Charts View</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>Lead Distribution</h4>
                                <canvas id="crm-leads-pie" width="400" height="400"></canvas>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>Sales Pipeline</h4>
                                <canvas id="crm-pipeline-donut" width="400" height="400"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Accounting Charts -->
            <div class="row module-section">
                <div class="col-md-12">
                    <h3><i class="fa fa-money"></i> Accounting Dashboard - Charts View</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>Payment Status</h4>
                                <canvas id="accounting-payment-pie" width="400" height="400"></canvas>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>Revenue Breakdown</h4>
                                <canvas id="accounting-revenue-donut" width="400" height="400"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Activity Charts -->
            <div class="row module-section">
                <div class="col-md-12">
                    <h3><i class="fa fa-tasks"></i> Activity Dashboard - Charts View</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>Task Status</h4>
                                <canvas id="activity-tasks-pie" width="400" height="400"></canvas>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>Project Status Alerts</h4>
                                <canvas id="activity-alerts-donut" width="400" height="400"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Service Contracts Charts -->
            <div class="row module-section">
                <div class="col-md-12">
                    <h3><i class="fa fa-file-text"></i> Service Contracts - Charts View</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>Contract Status</h4>
                                <canvas id="contracts-status-pie" width="400" height="400"></canvas>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>Contract Health</h4>
                                <canvas id="contracts-health-donut" width="400" height="400"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Product Categories Charts -->
            <div class="row module-section">
                <div class="col-md-12">
                    <h3><i class="fa fa-cube"></i> Product Categories - Charts View</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>Revenue by Category</h4>
                                <canvas id="products-revenue-pie" width="400" height="400"></canvas>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>Category Performance</h4>
                                <canvas id="products-performance-donut" width="400" height="400"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ToDo Charts -->
            <div class="row module-section">
                <div class="col-md-12">
                    <h3><i class="fa fa-check-square"></i> ToDo Dashboard - Charts View</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>ToDo Status Distribution</h4>
                                <canvas id="todo-status-pie" width="400" height="400"></canvas>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>ToDo Completion Rate</h4>
                                <canvas id="todo-completion-donut" width="400" height="400"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Activity Log Charts -->
            <div class="row module-section">
                <div class="col-md-12">
                    <h3><i class="fa fa-history"></i> Activity Log Dashboard - Charts View</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>Activity Types Distribution</h4>
                                <canvas id="activity-log-types-pie" width="400" height="400"></canvas>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="chart-card">
                                <h4>Communication Breakdown</h4>
                                <canvas id="activity-log-communication-donut" width="400" height="400"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initialize_charts(data) {
        // Load Chart.js if not loaded
        if (typeof Chart === 'undefined') {
            this.load_chartjs(() => {
                this.create_all_charts(data);
            });
        } else {
            this.create_all_charts(data);
        }
    }

    load_chartjs(callback) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    create_all_charts(data) {
        // CRM Charts
        if (!this.should_hide_crm()) {
            this.create_crm_charts(data.crm);
        }
        
        // Accounting Charts
        this.create_accounting_charts(data.accounting);
        
        // Activity Charts
        this.create_activity_charts(data.activity);
        
        // Contracts Charts
        this.create_contracts_charts(data.contracts);
        
        // Products Charts
        this.create_products_charts(data.products);
        
        // ToDo Charts
        this.create_todo_charts(data.todos);
        
        // Activity Log Charts
        this.create_activity_log_charts(data.activity_log);
    }

    create_todo_charts(todoData) {
        // ToDo Status Pie Chart
        const todoStatusCtx = document.getElementById('todo-status-pie');
        if (todoStatusCtx) {
            this.chart_instances['todo-status-pie'] = new Chart(todoStatusCtx, {
                type: 'pie',
                data: {
                    labels: ['Open ToDos', 'Closed ToDos', 'Cancelled ToDos'],
                    datasets: [{
                        data: [
                            todoData.counts.open,
                            todoData.counts.closed,
                            todoData.counts.cancelled
                        ],
                        backgroundColor: [
                            '#FFC107', // Yellow
                            '#4CAF50', // Green
                            '#F44336'  // Red
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.raw + ' todos';
                                }
                            }
                        }
                    }
                }
            });
        }

        // ToDo Completion Rate Donut Chart
        const todoCompletionCtx = document.getElementById('todo-completion-donut');
        if (todoCompletionCtx) {
            const totalTodos = todoData.counts.open + todoData.counts.closed + todoData.counts.cancelled;
            const completedTodos = todoData.counts.closed;
            const pendingTodos = todoData.counts.open + todoData.counts.cancelled;

            this.chart_instances['todo-completion-donut'] = new Chart(todoCompletionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Pending/Cancelled'],
                    datasets: [{
                        data: [completedTodos, pendingTodos],
                        backgroundColor: [
                            '#4CAF50', // Green
                            '#FF9800'  // Orange
                        ],
                        borderWidth: 3,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const percentage = totalTodos > 0 ? ((context.raw / totalTodos) * 100).toFixed(1) : 0;
                                    return context.label + ': ' + context.raw + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    create_activity_log_charts(activityLogData) {
        // Activity Types Pie Chart
        const activityTypesCtx = document.getElementById('activity-log-types-pie');
        if (activityTypesCtx) {
            this.chart_instances['activity-log-types-pie'] = new Chart(activityTypesCtx, {
                type: 'pie',
                data: {
                    labels: ['Emails', 'Calls', 'Meetings', 'Comments', 'Others'],
                    datasets: [{
                        data: [
                            activityLogData.counts.email,
                            activityLogData.counts.call,
                            activityLogData.counts.meeting,
                            activityLogData.counts.comment,
                            activityLogData.counts.other
                        ],
                        backgroundColor: [
                            '#2196F3', // Blue
                            '#4CAF50', // Green
                            '#FF9800', // Orange
                            '#9E9E9E', // Gray
                            '#9C27B0'  // Purple
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.raw + ' activities';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Communication Breakdown Donut Chart
        const communicationCtx = document.getElementById('activity-log-communication-donut');
        if (communicationCtx) {
            const totalCommunication = activityLogData.counts.email + activityLogData.counts.call + activityLogData.counts.meeting;
            const otherActivities = activityLogData.counts.comment + activityLogData.counts.other;

            this.chart_instances['activity-log-communication-donut'] = new Chart(communicationCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Direct Communication', 'Other Activities'],
                    datasets: [{
                        data: [totalCommunication, otherActivities],
                        backgroundColor: [
                            '#00BCD4', // Cyan
                            '#795548'  // Brown
                        ],
                        borderWidth: 3,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.raw + ' activities';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    create_crm_charts(crmData) {
        // Lead Distribution Pie Chart
        const leadsCtx = document.getElementById('crm-leads-pie');
        if (leadsCtx) {
            this.chart_instances['crm-leads-pie'] = new Chart(leadsCtx, {
                type: 'pie',
                data: {
                    labels: ['New Leads', 'Qualified Leads', 'Converted Leads', 'Lost Leads'],
                    datasets: [{
                        data: [
                            crmData.leads.new,
                            crmData.leads.qualified,
                            crmData.leads.converted,
                            crmData.leads.lost
                        ],
                        backgroundColor: [
                            '#4CAF50', // Green
                            '#FF9800', // Orange
                            '#2196F3', // Blue
                            '#F44336'  // Red
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Sales Pipeline Donut Chart
        const pipelineCtx = document.getElementById('crm-pipeline-donut');
        if (pipelineCtx) {
            this.chart_instances['crm-pipeline-donut'] = new Chart(pipelineCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Opportunities', 'Sales Orders'],
                    datasets: [{
                        data: [
                            crmData.opportunities_value,
                            crmData.sales_order_value
                        ],
                        backgroundColor: [
                            '#9C27B0', // Purple
                            '#00BCD4'  // Cyan
                        ],
                        borderWidth: 3,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ₹' + (context.raw / 100000).toFixed(1) + 'L';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    create_accounting_charts(accountingData) {
        // Payment Status Pie Chart
        const paymentCtx = document.getElementById('accounting-payment-pie');
        if (paymentCtx) {
            this.chart_instances['accounting-payment-pie'] = new Chart(paymentCtx, {
                type: 'pie',
                data: {
                    labels: ['Amount Received', 'Outstanding Amount', 'Yet to Receive'],
                    datasets: [{
                        data: [
                            accountingData.amount_received,
                            accountingData.outstanding_amount,
                            accountingData.yet_to_receive
                        ],
                        backgroundColor: [
                            '#4CAF50', // Green
                            '#F44336', // Red
                            '#FF9800'  // Orange
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ₹' + (context.raw / 100000).toFixed(1) + 'L';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Revenue Breakdown Donut Chart
        const revenueCtx = document.getElementById('accounting-revenue-donut');
        if (revenueCtx) {
            this.chart_instances['accounting-revenue-donut'] = new Chart(revenueCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Total Billed', 'Outstanding'],
                    datasets: [{
                        data: [
                            accountingData.total_billed - accountingData.outstanding_amount,
                            accountingData.outstanding_amount
                        ],
                        backgroundColor: [
                            '#2196F3', // Blue
                            '#FFC107'  // Yellow
                        ],
                        borderWidth: 3,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ₹' + (context.raw / 100000).toFixed(1) + 'L';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    create_activity_charts(activityData) {
        // Task Status Pie Chart
        const tasksCtx = document.getElementById('activity-tasks-pie');
        if (tasksCtx) {
            this.chart_instances['activity-tasks-pie'] = new Chart(tasksCtx, {
                type: 'pie',
                data: {
                    labels: ['Completed Tasks', 'Pending Tasks', 'Active Projects', 'Inactive Projects'],
                    datasets: [{
                        data: [
                            activityData.tasks.completed,
                            activityData.tasks.pending,
                            activityData.projects.active,
                            activityData.projects.inactive
                        ],
                        backgroundColor: [
                            '#4CAF50', // Green
                            '#FF9800', // Orange
                            '#2196F3', // Blue
                            '#9E9E9E'  // Gray
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.raw;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Status Alerts Donut Chart
        const alertsCtx = document.getElementById('activity-alerts-donut');
        if (alertsCtx) {
            this.chart_instances['activity-alerts-donut'] = new Chart(alertsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Red Alerts', 'Yellow Alerts', 'Green Status'],
                    datasets: [{
                        data: [
                            activityData.status_alerts.red,
                            activityData.status_alerts.yellow,
                            activityData.status_alerts.green
                        ],
                        backgroundColor: [
                            '#F44336', // Red
                            '#FFC107', // Yellow
                            '#4CAF50'  // Green
                        ],
                        borderWidth: 3,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.raw + ' projects';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    create_contracts_charts(contractsData) {
        // Contract Status Pie Chart
        const statusCtx = document.getElementById('contracts-status-pie');
        if (statusCtx) {
            this.chart_instances['contracts-status-pie'] = new Chart(statusCtx, {
                type: 'pie',
                data: {
                    labels: ['Active Contracts', 'Expired Contracts', 'Expiring in 15 Days'],
                    datasets: [{
                        data: [
                            contractsData.active_contracts,
                            contractsData.expired_contracts,
                            contractsData.expiring_in_15_days
                        ],
                        backgroundColor: [
                            '#4CAF50', // Green
                            '#F44336', // Red
                            '#FF9800'  // Orange
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.raw + ' contracts';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Contract Health Donut Chart
        const healthCtx = document.getElementById('contracts-health-donut');
        if (healthCtx) {
            const totalContracts = contractsData.active_contracts + contractsData.expired_contracts + contractsData.expiring_in_15_days;
            const healthyContracts = contractsData.active_contracts;
            const unhealthyContracts = contractsData.expired_contracts + contractsData.expiring_in_15_days;
            
            this.chart_instances['contracts-health-donut'] = new Chart(healthCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Healthy Contracts', 'Needs Attention'],
                    datasets: [{
                        data: [healthyContracts, unhealthyContracts],
                        backgroundColor: [
                            '#4CAF50', // Green
                            '#F44336'  // Red
                        ],
                        borderWidth: 3,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.raw + ' contracts';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    create_products_charts(productsData) {
        // Revenue by Category Pie Chart
        const revenueCtx = document.getElementById('products-revenue-pie');
        if (revenueCtx) {
            this.chart_instances['products-revenue-pie'] = new Chart(revenueCtx, {
                type: 'pie',
                data: {
                    labels: ['Staffing Revenue', 'CRM Doctor Revenue'],
                    datasets: [{
                        data: [
                            productsData.staffing_revenue,
                            productsData.crm_doctor_revenue
                        ],
                        backgroundColor: [
                            '#3F51B5', // Indigo
                            '#E91E63'  // Pink
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ₹' + (context.raw / 100000).toFixed(1) + 'L';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Category Performance Donut Chart
        const performanceCtx = document.getElementById('products-performance-donut');
        if (performanceCtx) {
            const totalRevenue = productsData.staffing_revenue + productsData.crm_doctor_revenue;
            const staffingPercentage = totalRevenue > 0 ? (productsData.staffing_revenue / totalRevenue * 100).toFixed(1) : 0;
            const crmPercentage = totalRevenue > 0 ? (productsData.crm_doctor_revenue / totalRevenue * 100).toFixed(1) : 0;
            
            this.chart_instances['products-performance-donut'] = new Chart(performanceCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Staffing (' + staffingPercentage + '%)', 'CRM Doctor (' + crmPercentage + '%)'],
                    datasets: [{
                        data: [
                            productsData.staffing_revenue,
                            productsData.crm_doctor_revenue
                        ],
                        backgroundColor: [
                            '#00BCD4', // Cyan
                            '#FF5722'  // Deep Orange
                        ],
                        borderWidth: 3,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ₹' + (context.raw / 100000).toFixed(1) + 'L';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    destroy_charts() {
        // Destroy existing chart instances to prevent memory leaks
        Object.keys(this.chart_instances).forEach(key => {
            if (this.chart_instances[key]) {
                this.chart_instances[key].destroy();
                delete this.chart_instances[key];
            }
        });
    }

    should_hide_crm() {
        return this.current_company === 'Bizinfra';
    }

    format_currency(amount) {
        return (amount / 100000).toFixed(1) + 'L';
    }

    setup_auto_refresh() {
        const self = this;
        this.refresh_interval = setInterval(function() {
            self.load_dashboard_data();
        }, 300000); // Refresh every 5 minutes
    }

    destroy() {
        if (this.refresh_interval) {
            clearInterval(this.refresh_interval);
        }
        this.destroy_charts();
    }
}