import { connect } from 'react-redux';
import { createToolbarEvent } from '../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../analytics/functions';
import { translate } from '../../../../base/i18n/functions';
import { IconAddUser } from '../../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../../base/toolbox/components/AbstractButton';
import { getLocalParticipant } from '../../../../base/participants/functions';

/**
 * Implementation of a custom button for opening invite people dialog.
 */
class InviteButton extends AbstractButton<AbstractButtonProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.invite';
    override icon = IconAddUser;
    override label = 'toolbar.invite';
    override tooltip = 'toolbar.invite';

    // Custom dialog reference
    private inviteDialog: HTMLElement | null = null;
    private allUsers: any[] = [];
    private groupsData: any[] = [];
    private filteredUsers: any[] = [];

    /**
     * Handles clicking / pressing the button, and opens the custom invite dialog.
     *
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;
        sendAnalytics(createToolbarEvent('invite'));

        // Get the Redux state
        const state = APP.store.getState();
        const localParticipant = getLocalParticipant(state);

        // Check if user is a moderator
        if (localParticipant?.role !== 'moderator') {
            alert('Only Moderators can send invites.');
            return;
        }

        // Current user
        console.log('Current user:', 'pranaykumar2');
        console.log('Current date/time:', '2025-05-04 09:34:44');

        // Create and display the custom invite dialog
        this.showCustomInviteDialog();
    }

    /**
     * Creates and displays the custom invite dialog.
     *
     * @private
     * @returns {void}
     */
    private showCustomInviteDialog(): void {
        // Cleanup any existing dialogs
        this.closeDialog();

        // Inject CSS Styles
        this.injectStyles();

        // Create dialog container
        const dialog = document.createElement('div');
        dialog.className = 'invite-dialog';

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'invite-overlay';
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.closeDialog();
            }
        };

        // Add dialog header
        const header = document.createElement('div');
        header.className = 'invite-header';

        const title = document.createElement('h2');
        title.textContent = 'Invite People';
        title.className = 'invite-title';

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        closeButton.className = 'invite-close-btn';
        closeButton.onclick = () => this.closeDialog();

        header.appendChild(title);
        header.appendChild(closeButton);
        dialog.appendChild(header);

        // Add loading indicator initially
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'invite-loading';
        loadingDiv.innerHTML = `
            <div class="invite-spinner"></div>
            <p>Loading users and groups...</p>
        `;
        dialog.appendChild(loadingDiv);

        // Create content container that will hold group dropdown and user checkboxes
        const contentDiv = document.createElement('div');
        contentDiv.id = 'invite-content';
        contentDiv.className = 'invite-content';
        dialog.appendChild(contentDiv);

        // Create footer with send button
        const footer = document.createElement('div');
        footer.className = 'invite-footer';

        const sendButton = document.createElement('button');
        sendButton.textContent = 'Send Invites';
        sendButton.className = 'invite-send-btn invite-send-btn-disabled';
        sendButton.disabled = true;
        sendButton.id = 'invite-send-button';

        sendButton.onclick = () => this.sendInvites();

        footer.appendChild(sendButton);
        dialog.appendChild(footer);

        // Add dialog to DOM
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
        this.inviteDialog = dialog;

        // Fetch both groups and users in parallel
        this.fetchGroupsAndUsers(loadingDiv, contentDiv);
    }

    /**
     * Injects the CSS styles for the custom dialog
     */
    private injectStyles(): void {
        // Remove any existing styles
        const existingStyle = document.getElementById('invite-dialog-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'invite-dialog-styles';
        style.textContent = `
            .invite-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.65);
                z-index: 999;
                backdrop-filter: blur(2px);
            }
            
            .invite-dialog {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #fff;
                color: #1f2937;
                border-radius: 12px;
                width: 500px;
                max-width: 90vw;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                overflow: hidden;
                animation: dialog-fade-in 0.3s ease;
            }
            
            @keyframes dialog-fade-in {
                from { opacity: 0; transform: translate(-50%, -48%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
            
            .invite-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .invite-title {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                color: #111827;
            }
            
            .invite-close-btn {
                background: none;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                transition: all 0.2s;
            }
            
            .invite-close-btn:hover {
                background-color: #f3f4f6;
                color: #111827;
            }
            
            .invite-content {
                padding: 24px;
                overflow-y: auto;
                flex: 1;
            }
            
            .invite-footer {
                padding: 16px 24px;
                display: flex;
                justify-content: flex-end;
                border-top: 1px solid #e5e7eb;
                background-color: #f9fafb;
            }
            
            .invite-send-btn {
                padding: 10px 20px;
                background-color: #2563eb;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .invite-send-btn:hover:not(:disabled) {
                background-color: #1d4ed8;
                box-shadow: 0 2px 5px rgba(37, 99, 235, 0.3);
            }
            
            .invite-send-btn-disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .invite-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
            }
            
            .invite-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(37, 99, 235, 0.3);
                border-radius: 50%;
                border-left-color: #2563eb;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .invite-group-section {
                margin-bottom: 24px;
            }
            
            .invite-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #374151;
                font-size: 14px;
            }
            
            .invite-select {
                width: 100%;
                padding: 10px 12px;
                border-radius: 6px;
                border: 1px solid #d1d5db;
                background-color: #fff;
                font-size: 14px;
                color: #1f2937;
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 12px center;
                background-size: 16px;
                transition: border-color 0.2s;
            }
            
            .invite-select:focus {
                outline: none;
                border-color: #2563eb;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
            }
            
            .invite-search-container {
                position: relative;
                margin-bottom: 16px;
            }
            
            .invite-search-icon {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: #6b7280;
                pointer-events: none;
            }
            
            .invite-search {
                width: 100%;
                padding: 10px 12px 10px 38px;
                border-radius: 6px;
                border: 1px solid #d1d5db;
                background-color: #fff;
                font-size: 14px;
                color: #1f2937;
                transition: border-color 0.2s;
            }
            
            .invite-search:focus {
                outline: none;
                border-color: #2563eb;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
            }
            
            .invite-users-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .invite-users-title {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #374151;
            }
            
            .invite-select-all {
                display: flex;
                align-items: center;
            }
            
            .invite-checkbox {
                width: 16px;
                height: 16px;
                cursor: pointer;
                accent-color: #2563eb;
            }
            
            .invite-checkbox-label {
                margin-left: 6px;
                font-size: 14px;
                color: #4b5563;
                cursor: pointer;
            }
            
            .invite-users-list {
                max-height: 250px;
                overflow-y: auto;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                background-color: #f9fafb;
            }
            
            .invite-user-item {
                padding: 10px 12px;
                display: flex;
                align-items: center;
                border-bottom: 1px solid #e5e7eb;
                transition: background-color 0.15s;
            }
            
            .invite-user-item:last-child {
                border-bottom: none;
            }
            
            .invite-user-item:hover {
                background-color: #f3f4f6;
            }
            
            .invite-no-results {
                text-align: center;
                padding: 20px;
                color: #6b7280;
                font-style: italic;
            }
            
            /* Custom scrollbar */
            .invite-users-list::-webkit-scrollbar {
                width: 8px;
            }
            
            .invite-users-list::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }
            
            .invite-users-list::-webkit-scrollbar-thumb {
                background: #c5c7d0;
                border-radius: 4px;
            }
            
            .invite-users-list::-webkit-scrollbar-thumb:hover {
                background: #a3a8b8;
            }
            
            /* Responsive adjustments */
            @media (max-width: 576px) {
                .invite-dialog {
                    width: 100%;
                    max-width: 100%;
                    height: 100%;
                    max-height: 100%;
                    border-radius: 0;
                }
                
                .invite-users-list {
                    max-height: 40vh;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Fetches both groups and users data in parallel.
     *
     * @private
     * @param {HTMLElement} loadingDiv - The loading indicator element.
     * @param {HTMLElement} contentDiv - The content container element.
     * @returns {void}
     */
    private fetchGroupsAndUsers(loadingDiv: HTMLElement, contentDiv: HTMLElement): void {
        // Create promises for both API calls
        const groupsPromise = fetch('https://10.10.81.211:9003/groups', {
            method: 'GET',
            credentials: 'include'
        }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch groups');
            }
            return response.json();
        });

        const usersPromise = fetch('https://10.10.81.211:9003/invite', {
            method: 'GET',
            credentials: 'include'
        }).then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            return response.json();
        });

        // Wait for both promises to resolve
        Promise.all([groupsPromise, usersPromise])
            .then(([groups, userData]) => {
                // Debug: Log the data we're getting
                console.log('Groups data:', JSON.stringify(groups));
                console.log('Users data:', JSON.stringify(userData));

                // Store the data for later use
                this.groupsData = groups;
                this.allUsers = userData.users_list || [];
                this.filteredUsers = [...this.allUsers]; // Initialize filtered users

                // Remove loading indicator
                if (loadingDiv.parentElement) {
                    loadingDiv.parentElement.removeChild(loadingDiv);
                }

                // Create the UI with the fetched data
                this.createUserSelectionUI(contentDiv);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                // Show error in dialog
                loadingDiv.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                         stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p style="color: #e11d48; margin-top: 8px;">Failed to load users and groups. Please try again later.</p>
                `;
                loadingDiv.style.padding = '40px';
                loadingDiv.style.textAlign = 'center';
            });
    }

    /**
     * Creates the user selection UI with group filter dropdown.
     *
     * @private
     * @param {HTMLElement} contentDiv - The content container element.
     * @returns {void}
     */
    private createUserSelectionUI(contentDiv: HTMLElement): void {
        // Create group filter section
        const groupSection = document.createElement('div');
        groupSection.className = 'invite-group-section';

        const groupLabel = document.createElement('label');
        groupLabel.textContent = 'Filter by Group';
        groupLabel.className = 'invite-label';

        const groupSelect = document.createElement('select');
        groupSelect.className = 'invite-select';

        // Add "All Users" option
        const allUsersOption = document.createElement('option');
        allUsersOption.value = 'all';
        allUsersOption.textContent = 'All Users';
        allUsersOption.selected = true;
        groupSelect.appendChild(allUsersOption);

        // Add group options
        this.groupsData.forEach(group => {
            const option = document.createElement('option');
            option.value = group.groupname;
            option.textContent = group.groupname;
            groupSelect.appendChild(option);
        });

        // Add search input
        const searchContainer = document.createElement('div');
        searchContainer.className = 'invite-search-container';

        const searchIcon = document.createElement('span');
        searchIcon.className = 'invite-search-icon';
        searchIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
        `;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search users...';
        searchInput.className = 'invite-search';
        
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);

        // Create users section container
        const usersSection = document.createElement('div');
        usersSection.id = 'users-section';
        usersSection.style.marginTop = '20px';

        // Initially show all users
        this.createUsersCheckboxes(usersSection, this.allUsers);

        // Add change event to group dropdown
        groupSelect.addEventListener('change', () => {
            const selectedValue = groupSelect.value;
            searchInput.value = '';

            // Filter users based on group selection
            this.filterUsers(selectedValue, '', usersSection);
        });

        // Add input event to search box
        searchInput.addEventListener('input', () => {
            const selectedGroup = groupSelect.value;
            const searchTerm = searchInput.value.toLowerCase();
            
            // Filter users based on search term and selected group
            this.filterUsers(selectedGroup, searchTerm, usersSection);
        });

        // Append all elements
        groupSection.appendChild(groupLabel);
        groupSection.appendChild(groupSelect);
        contentDiv.appendChild(groupSection);
        contentDiv.appendChild(searchContainer);
        contentDiv.appendChild(usersSection);
    }

    /**
     * Filters users based on selected group and search term
     * 
     * @private
     * @param {string} selectedGroup - The selected group name
     * @param {string} searchTerm - The search term
     * @param {HTMLElement} usersSection - The users section container
     * @returns {void}
     */
    private filterUsers(selectedGroup: string, searchTerm: string, usersSection: HTMLElement): void {
        // Clear current users section
        usersSection.innerHTML = '';

        let usersToDisplay: any[] = [];

        // First filter by group
        if (selectedGroup === 'all') {
            usersToDisplay = [...this.allUsers];
        } else {
            // Find the selected group
            const selectedGroupData = this.groupsData.find(g => g.groupname === selectedGroup);

            if (selectedGroupData && Array.isArray(selectedGroupData.members) && selectedGroupData.members.length > 0) {
                usersToDisplay = selectedGroupData.members;
            }
        }

        // Then filter by search term if provided
        if (searchTerm) {
            usersToDisplay = usersToDisplay.filter(user => {
                const displayName = (user.displayname || user.username || '').toLowerCase();
                const username = (user.username || '').toLowerCase();
                return displayName.includes(searchTerm) || username.includes(searchTerm);
            });
        }

        // Store filtered users
        this.filteredUsers = usersToDisplay;

        // Display filtered users
        this.createUsersCheckboxes(usersSection, usersToDisplay);

        // Update send button state
        this.updateSendButtonState();
    }

    /**
     * Creates the users checkboxes section.
     *
     * @private
     * @param {HTMLElement} usersSection - The users section container.
     * @param {Array} users - Array of user objects.
     * @returns {void}
     */
    private createUsersCheckboxes(usersSection: HTMLElement, users: any[]): void {
        // Create users section header
        const usersHeader = document.createElement('div');
        usersHeader.className = 'invite-users-header';

        const usersTitle = document.createElement('h3');
        usersTitle.textContent = 'Select Users to Invite';
        usersTitle.className = 'invite-users-title';

        // Create "Select All" checkbox
        const selectAllContainer = document.createElement('div');
        selectAllContainer.className = 'invite-select-all';

        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = 'select-all-users';
        selectAllCheckbox.className = 'invite-checkbox';

        const selectAllLabel = document.createElement('label');
        selectAllLabel.htmlFor = 'select-all-users';
        selectAllLabel.textContent = 'Select All';
        selectAllLabel.className = 'invite-checkbox-label';

        selectAllContainer.appendChild(selectAllCheckbox);
        selectAllContainer.appendChild(selectAllLabel);

        usersHeader.appendChild(usersTitle);
        usersHeader.appendChild(selectAllContainer);
        usersSection.appendChild(usersHeader);

        // Create users list container
        const usersList = document.createElement('div');
        usersList.className = 'invite-users-list';

        // Debug: Log users length
        console.log(`Displaying ${users.length} users`);

        // Add user checkboxes
        if (!users || users.length === 0) {
            const noUsers = document.createElement('div');
            noUsers.className = 'invite-no-results';
            noUsers.textContent = 'No users found. Try another search or group.';
            usersList.appendChild(noUsers);
        } else {
            users.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.className = 'invite-user-item';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `user-${user.username}`;
                checkbox.className = 'invite-checkbox user-checkbox';
                checkbox.value = user.username;
                checkbox.dataset.type = 'user';

                // Add change event to update send button state
                checkbox.addEventListener('change', () => this.updateSendButtonState());

                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = `${user.displayname || user.username} (${user.username})`;
                label.className = 'invite-checkbox-label';

                userDiv.appendChild(checkbox);
                userDiv.appendChild(label);
                usersList.appendChild(userDiv);
            });

            // Add event listener to "Select All" checkbox
            selectAllCheckbox.addEventListener('change', () => {
                const checkboxes = usersList.querySelectorAll('.user-checkbox') as NodeListOf<HTMLInputElement>;
                checkboxes.forEach(checkbox => {
                    checkbox.checked = selectAllCheckbox.checked;
                });

                // Update send button state
                this.updateSendButtonState();
            });
        }

        usersSection.appendChild(usersList);
    }

    /**
     * Updates the state of the send button based on user selections.
     *
     * @private
     * @returns {void}
     */
    private updateSendButtonState(): void {
        if (!this.inviteDialog) {
            return;
        }

        const sendButton = this.inviteDialog.querySelector('#invite-send-button') as HTMLButtonElement;
        if (!sendButton) {
            return;
        }

        const anyChecked = Array.from(
            this.inviteDialog.querySelectorAll('.user-checkbox')
        ).some((checkbox: any) => checkbox.checked);

        sendButton.disabled = !anyChecked;
        
        if (anyChecked) {
            sendButton.classList.remove('invite-send-btn-disabled');
        } else {
            sendButton.classList.add('invite-send-btn-disabled');
        }
    }

    /**
     * Collects selected users and sends invites.
     *
     * @private
     * @returns {void}
     */
    private sendInvites(): void {
        if (!this.inviteDialog) {
            return;
        }

        const selectedUsers: string[] = [];

        // Get all checked user checkboxes
        const checkboxes = this.inviteDialog.querySelectorAll('.user-checkbox:checked');

        checkboxes.forEach((checkbox: any) => {
            selectedUsers.push(checkbox.value);
        });

        // Get the selected group
        const groupSelect = this.inviteDialog.querySelector('select') as HTMLSelectElement;
        const selectedGroup = groupSelect ? groupSelect.value : '';

        // Only include the group in the request if it's not "all"
        const selectedGroups = (selectedGroup && selectedGroup !== 'all') ? [selectedGroup] : [];

        console.log('Sending invites to:', {
            groups: selectedGroups,
            users: selectedUsers
        });

        // Show loading state on button
        const sendButton = this.inviteDialog.querySelector('#invite-send-button') as HTMLButtonElement;
        const originalButtonText = sendButton.textContent;
        sendButton.disabled = true;
        sendButton.classList.add('invite-send-btn-disabled');
        sendButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 style="animation: spin 1s linear infinite; margin-right: 8px;">
                <circle cx="12" cy="12" r="10" stroke-dasharray="50" stroke-dashoffset="25"></circle>
            </svg>
            Sending...
        `;

        // Send invite request
        fetch('https://10.10.81.211:9003/invite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                selected_groups: selectedGroups,
                selected_usernames: selectedUsers,
                window_href: window.location.href,
                hostname: window.location.hostname
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to send invites');
                }

                // Check if the response is JSON or plain text
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                } else {
                    // For non-JSON responses, just return the text
                    return response.text();
                }
            })
            .then(data => {
                // Create success notification
                const notification = document.createElement('div');
                notification.style.position = 'fixed';
                notification.style.bottom = '24px';
                notification.style.right = '24px';
                notification.style.backgroundColor = '#10b981';
                notification.style.color = 'white';
                notification.style.padding = '16px 24px';
                notification.style.borderRadius = '8px';
                notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                notification.style.display = 'flex';
                notification.style.alignItems = 'center';
                notification.style.zIndex = '9999';
                notification.style.animation = 'slide-in 0.3s ease';
                notification.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         style="margin-right: 12px;">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span>Invitations sent successfully!</span>
                `;
                
                // Add style for animation
                const animStyle = document.createElement('style');
                animStyle.textContent = `
                    @keyframes slide-in {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(animStyle);
                
                document.body.appendChild(notification);
                
                // Remove notification after 5 seconds
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.style.animation = 'slide-out 0.3s ease';
                        notification.style.animationFillMode = 'forwards';
                        
                        // Add slide-out animation
                        const slideOutStyle = document.createElement('style');
                        slideOutStyle.textContent = `
                            @keyframes slide-out {
                                from { transform: translateX(0); opacity: 1; }
                                to { transform: translateX(100%); opacity: 0; }
                            }
                        `;
                        document.head.appendChild(slideOutStyle);
                        
                        // Remove after animation completes
                        setTimeout(() => {
                            if (notification.parentNode) {
                                notification.parentNode.removeChild(notification);
                            }
                        }, 300);
                    }
                }, 5000);
                
                this.closeDialog();
            })
            .catch(error => {
                console.error('Error sending invites:', error);
                
                // Restore button state
                sendButton.disabled = false;
                sendButton.classList.remove('invite-send-btn-disabled');
                sendButton.textContent = originalButtonText || 'Send Invites';
                
                // Show error message
                const errorMsg = document.createElement('div');
                errorMsg.textContent = 'Failed to send invites. Please try again.';
                errorMsg.style.color = '#e11d48';
                errorMsg.style.fontSize = '14px';
                errorMsg.style.marginTop = '8px';
                errorMsg.style.textAlign = 'center';
                
                const footer = this.inviteDialog.querySelector('.invite-footer');
                if (footer) {
                    footer.insertBefore(errorMsg, footer.firstChild);
                    
                    // Remove error message after 5 seconds
                    setTimeout(() => {
                        if (errorMsg.parentNode) {
                            errorMsg.parentNode.removeChild(errorMsg);
                        }
                    }, 5000);
                }
            });
    }

    /**
     * Closes the invite dialog.
     *
     * @private
     * @returns {void}
     */
    private closeDialog(): void {
        // Remove dialog and overlay if they exist
        const overlay = document.querySelector('.invite-overlay');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }

        if (this.inviteDialog && this.inviteDialog.parentNode) {
            this.inviteDialog.parentNode.removeChild(this.inviteDialog);
            this.inviteDialog = null;
        }
    }
}

export default translate(connect()(InviteButton));