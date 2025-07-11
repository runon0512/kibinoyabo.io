document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const schoolList = document.getElementById('schoolList');
    const newSchoolButton = document.getElementById('newSchoolButton');
    const currentSchoolTitle = document.getElementById('currentSchoolTitle');
    const scoreInputsContainer = document.getElementById('scoreInputsContainer');
    const calculateButton = document.getElementById('calculateButton');
    const scoresDisplay = document.getElementById('scoresDisplay');
    const averageResult = document.getElementById('averageResult');
    const groupList = document.getElementById('groupList');
    const newGroupButton = document.getElementById('newGroupButton');
    const groupAverageResults = document.getElementById('groupAverageResults');

    let schools = [];
    let activeSchoolId = null;
    let activeGroupId = null;

    // Helper function to generate a random bright color
    function getRandomLightColor() {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 85%)`; // Light saturation and lightness
    }

    // Event listeners (event delegation) remain mostly the same

    scoreInputsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-score-btn')) {
            const entryDiv = event.target.closest('.score-entry');
            if (entryDiv) {
                entryDiv.remove();
                renumberScoreEntries();
                updateCurrentSchoolScores();
            }
        }

        if (event.target.classList.contains('not-taken-btn')) {
            event.preventDefault();
            const notTakenBtn = event.target;
            const entryDiv = notTakenBtn.closest('.score-entry');
            const scoreInput = entryDiv.querySelector('.score-input');

            notTakenBtn.classList.toggle('active');
            entryDiv.classList.toggle('not-taken');

            if (notTakenBtn.classList.contains('active')) {
                scoreInput.disabled = true;
                scoreInput.value = '';
            } else {
                scoreInput.disabled = false;
            }
            updateCurrentSchoolScores();
        }

        if (event.target.classList.contains('add-student-to-group-btn')) {
            const groupId = event.target.dataset.groupId;
            const targetGroupScoresDiv = document.getElementById(`group-scores-${groupId}`);
            if (targetGroupScoresDiv) {
                const newScoreObject = { value: null, notTaken: false, groupId: groupId };
                createNewScoreInput(newScoreObject, targetGroupScoresDiv);

                const activeSchool = schools.find(s => s.id === activeSchoolId);
                if (activeSchool) {
                    activeSchool.scores.push(newScoreObject);
                    saveSchools();
                }
                renumberScoreEntries();
                const lastInput = targetGroupScoresDiv.querySelector('.score-entry:last-child .score-input');
                if (lastInput) {
                    lastInput.focus();
                }
            }
        }
    });

    scoreInputsContainer.addEventListener('input', (event) => {
        if (event.target.classList.contains('score-input') || event.target.classList.contains('group-select')) {
            updateCurrentSchoolScores();
            if (event.target.classList.contains('group-select')) {
                renderActiveSchoolContent();
            }
        }
    });

    scoreInputsContainer.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.target.classList.contains('score-input')) {
            event.preventDefault();
            const entryDiv = event.target.closest('.score-entry');
            const groupId = entryDiv.querySelector('.group-select')?.value || 'default';
            const addBtn = scoreInputsContainer.querySelector(`.add-student-to-group-btn[data-group-id="${groupId}"]`);
            if (addBtn) {
                addBtn.click();
            }
        }
    });

    groupList.addEventListener('click', (event) => {
        const groupItem = event.target.closest('.group-item');
        if (!groupItem) return;

        const groupId = groupItem.dataset.groupId;

        if (event.target.classList.contains('edit-group-btn')) {
            makeGroupNameEditable(groupItem, groupId);
            event.stopPropagation();
            return;
        }

        if (event.target.classList.contains('delete-group-btn')) {
            deleteGroup(groupId);
            event.stopPropagation();
            return;
        }

        activeGroupId = groupId;
        saveSchools();
        renderGroupList();
    });


    // Load schools from local storage
    function loadSchools() {
        const storedSchools = localStorage.getItem('schools');
        if (storedSchools) {
            schools = JSON.parse(storedSchools);
            activeSchoolId = localStorage.getItem('activeSchoolId');

            schools.forEach(school => {
                if (!school.groups) {
                    school.groups = [{ id: 'default', name: 'その他', color: getRandomLightColor() }];
                } else {
                    // Ensure all existing groups have a color, add one if missing
                    school.groups.forEach(group => {
                        if (!group.color) {
                            group.color = getRandomLightColor();
                        }
                    });
                }
                if (school.scores) {
                    school.scores.forEach(score => {
                        if (score.groupId === undefined) {
                            score.groupId = 'default';
                        }
                    });
                }
            });

        } else {
            createNewSchool('スクール 1');
        }

        if (!activeSchoolId && schools.length > 0) {
            activeSchoolId = schools[0].id;
        }
        renderSchoolList();
        renderActiveSchoolContent();
    }

    // Save schools to local storage
    function saveSchools() {
        localStorage.setItem('schools', JSON.stringify(schools));
        localStorage.setItem('activeSchoolId', activeSchoolId);
    }

    // Create a new school
    function createNewSchool(name = null) {
        const newId = Date.now().toString();
        const schoolName = name || `スクール ${schools.length + 1}`;
        const newSchool = {
            id: newId,
            name: schoolName,
            scores: [],
            groups: [{ id: 'default', name: 'その他', color: getRandomLightColor() }], // Default group with a color
            currentScoresDisplay: 'なし',
            currentAverageResult: '有効な点数を入力してください',
            statistics: null,
            groupAverages: {}
        };
        schools.push(newSchool);
        activeSchoolId = newId;
        saveSchools();
        renderSchoolList();
        renderActiveSchoolContent();
        activeGroupId = 'default';
    }

    // Render school list (sidebar)
    function renderSchoolList() {
        schoolList.innerHTML = '';
        schools.forEach(school => {
            const schoolItem = document.createElement('div');
            schoolItem.className = `school-item ${school.id === activeSchoolId ? 'active' : ''}`;
            schoolItem.dataset.schoolId = school.id;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = school.name;

            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'school-item-buttons';

            const editButton = document.createElement('button');
            editButton.className = 'edit-school-btn';
            editButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>`;

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-school-btn';
            deleteButton.dataset.schoolId = school.id;
            deleteButton.innerHTML = '&times;';

            buttonsContainer.appendChild(editButton);
            buttonsContainer.appendChild(deleteButton);

            schoolItem.appendChild(nameSpan);
            schoolItem.appendChild(buttonsContainer);
            schoolList.appendChild(schoolItem);

            schoolItem.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.closest('.school-item-buttons')) {
                    return;
                }
                activeSchoolId = school.id;
                saveSchools();
                renderSchoolList();
                renderActiveSchoolContent();
            });

            editButton.addEventListener('click', () => {
                if (schoolList.querySelector('.school-name-input')) {
                    return;
                }
                makeSchoolNameEditable(school, nameSpan, schoolItem);
            });

            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                deleteSchool(school.id);
            });
        });
    }

    // Make school name editable
    function makeSchoolNameEditable(school, spanElement, itemElement) {
        spanElement.style.display = 'none';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'school-name-input';
        input.value = school.name;

        itemElement.insertBefore(input, spanElement.nextSibling);
        input.focus();
        input.select();

        const finishEditing = (shouldSave) => {
            input.removeEventListener('blur', onBlur);
            input.removeEventListener('keydown', onKeydown);

            const newName = input.value.trim();
            if (shouldSave && newName && newName !== school.name) {
                school.name = newName;
                saveSchools();
                spanElement.textContent = newName;
                if (school.id === activeSchoolId) {
                    currentSchoolTitle.textContent = newName;
                }
            }

            itemElement.removeChild(input);
            spanElement.style.display = '';
        };

        const onBlur = () => finishEditing(true);
        const onKeydown = (e) => {
            if (e.key === 'Enter') finishEditing(true);
            if (e.key === 'Escape') finishEditing(false);
        };

        input.addEventListener('blur', onBlur);
        input.addEventListener('keydown', onKeydown);
    }

    // Render active school content
    function renderActiveSchoolContent() {
        const activeSchool = schools.find(s => s.id === activeSchoolId);
        if (!activeSchool) {
            createNewSchool('スクール 1');
            return;
        }

        currentSchoolTitle.textContent = activeSchool.name;
        scoresDisplay.textContent = activeSchool.currentScoresDisplay;
        averageResult.textContent = activeSchool.currentAverageResult;

        renderGroupList();
        renderGroupAverageResults(activeSchool.groupAverages || {});

        scoreInputsContainer.innerHTML = '';

        const sortedScores = [...activeSchool.scores].sort((a, b) => {
            const groupA = activeSchool.groups.find(g => g.id === a.groupId)?.name || '';
            const groupB = activeSchool.groups.find(g => g.id === b.groupId)?.name || '';
            return groupA.localeCompare(groupB);
        });

        const groupedScores = sortedScores.reduce((acc, score) => {
            const groupId = score.groupId || 'default';
            if (!acc[groupId]) {
                acc[groupId] = [];
            }
            acc[groupId].push(score);
            return acc;
        }, {});

        activeSchool.groups.forEach(group => {
            const groupSection = document.createElement('div');
            groupSection.className = 'group-section';
            groupSection.dataset.groupId = group.id;
            groupSection.style.backgroundColor = group.color; // Apply group color
            groupSection.style.borderColor = group.color; // Apply group color to border

            const groupTitle = document.createElement('h3');
            groupTitle.textContent = group.name;
            groupSection.appendChild(groupTitle);

            const groupScoresDiv = document.createElement('div');
            groupScoresDiv.className = 'group-scores-container';
            groupScoresDiv.id = `group-scores-${group.id}`;
            groupSection.appendChild(groupScoresDiv);

            const addStudentToGroupButton = document.createElement('button');
            addStudentToGroupButton.type = 'button';
            addStudentToGroupButton.textContent = `＋ ${group.name}に生徒を追加`;
            addStudentToGroupButton.classList.add('add-student-to-group-btn');
            addStudentToGroupButton.dataset.groupId = group.id;
            groupSection.appendChild(addStudentToGroupButton);

            scoreInputsContainer.appendChild(groupSection);

            const scoresInThisGroup = groupedScores[group.id] || [];
            scoresInThisGroup.forEach(scoreObject => {
                createNewScoreInput(scoreObject, groupScoresDiv);
            });
        });


        const resultSection = document.querySelector('.result-section');
        const existingStatsDiv = resultSection.querySelector('#statistics-results');
        if (existingStatsDiv) {
            existingStatsDiv.remove();
        }

        if (activeSchool.statistics) {
            const stats = activeSchool.statistics;
            const statsDiv = document.createElement('div');
            statsDiv.id = 'statistics-results';
            statsDiv.innerHTML = `
                <p>中央値 (Q2): <span class="stat-value">${stats.median.toFixed(2)} 点</span></p>
                <p>第一四分位数 (Q1): <span class="stat-value">${stats.q1.toFixed(2)} 点</span></p>
                <p>第三四分位数 (Q3): <span class="stat-value">${stats.q3.toFixed(2)} 点</span></p>
                <div id="boxplot-container">
                    <p>箱ひげ図 (0点から100点):</p>
                    <svg id="boxplot-svg" width="100%" height="80"></svg>
                </div>
            `;
            resultSection.appendChild(statsDiv);

            drawBoxPlot(stats);
        }

        renumberScoreEntries();
    }

    // Delete a school
    function deleteSchool(idToDelete) {
        if (schools.length === 1) {
            alert('最後のスクールは削除できません。');
            return;
        }

        const confirmDelete = confirm('このスクールを削除してもよろしいですか？');
        if (!confirmDelete) {
            return;
        }

        schools = schools.filter(s => s.id !== idToDelete);

        if (activeSchoolId === idToDelete) {
            activeSchoolId = schools.length > 0 ? schools[0].id : null;
        }
        saveSchools();
        renderSchoolList();
        renderActiveSchoolContent();
    }

    // Create a new score input entry
    function createNewScoreInput(scoreObject = { value: null, notTaken: false, groupId: 'default' }, parentContainer = null) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'score-entry';

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'score-input';
        input.placeholder = '点数';
        input.min = '0';
        input.max = '100';

        const groupSelectContainer = document.createElement('div');
        groupSelectContainer.className = 'group-select-container';
        const groupSelect = document.createElement('select');
        groupSelect.className = 'group-select';

        const activeSchool = schools.find(s => s.id === activeSchoolId);
        if (activeSchool && activeSchool.groups) {
            activeSchool.groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                groupSelect.appendChild(option);
            });
        }
        groupSelect.value = scoreObject.groupId || 'default';
        groupSelectContainer.appendChild(groupSelect);


        const notTakenButton = document.createElement('button');
        notTakenButton.className = 'not-taken-btn';
        notTakenButton.textContent = '未受験';

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-score-btn';
        deleteButton.textContent = '削除';

        if (scoreObject.value !== null) {
            input.value = scoreObject.value;
        }
        if (scoreObject.notTaken) {
            input.disabled = true;
            entryDiv.classList.add('not-taken');
            notTakenButton.classList.add('active');
        }

        entryDiv.appendChild(input);
        entryDiv.appendChild(groupSelectContainer);
        entryDiv.appendChild(notTakenButton);
        entryDiv.appendChild(deleteButton);

        (parentContainer || scoreInputsContainer).appendChild(entryDiv);
    }

    // Renumber score entries per group
    function renumberScoreEntries() {
        const groupScoreContainers = scoreInputsContainer.querySelectorAll('.group-scores-container');

        groupScoreContainers.forEach(container => {
            const scoreEntries = container.querySelectorAll('.score-entry');
            scoreEntries.forEach((entry, index) => {
                let numberSpan = entry.querySelector('.attendance-number');
                if (!numberSpan) {
                    numberSpan = document.createElement('span');
                    numberSpan.className = 'attendance-number';
                    entry.prepend(numberSpan);
                }
                numberSpan.textContent = `${index + 1}.`;
            });
        });
    }

    // Update current school's score data
    function updateCurrentSchoolScores() {
        const activeSchool = schools.find(s => s.id === activeSchoolId);
        if (activeSchool) {
            const scoreEntries = scoreInputsContainer.querySelectorAll('.score-entry');
            activeSchool.scores = Array.from(scoreEntries).map(entry => {
                const input = entry.querySelector('.score-input');
                const notTakenBtn = entry.querySelector('.not-taken-btn');
                const groupSelect = entry.querySelector('.group-select');
                const value = parseFloat(input.value);
                return {
                    value: isNaN(value) ? null : value,
                    notTaken: notTakenBtn.classList.contains('active'),
                    groupId: groupSelect ? groupSelect.value : 'default'
                };
            });
            saveSchools();
        }
    }

    // --- Group related functions ---

    // Create a new group
    function createNewGroup(name = null) {
        const activeSchool = schools.find(s => s.id === activeSchoolId);
        if (activeSchool) {
            const newGroupId = Date.now().toString();
            const groupName = name || ` ${activeSchool.groups.length} 組`;
            // Assign a random light color to the new group
            const newGroup = { id: newGroupId, name: groupName, color: getRandomLightColor() };
            activeSchool.groups.push(newGroup);
            saveSchools();
            renderGroupList();
            renderActiveSchoolContent();
        }
    }

    // Render group list
    function renderGroupList() {
        groupList.innerHTML = '';
        const activeSchool = schools.find(s => s.id === activeSchoolId);
        if (activeSchool && activeSchool.groups) {
            activeSchool.groups.forEach(group => {
                const groupItem = document.createElement('div');
                groupItem.className = `group-item ${group.id === activeGroupId ? 'active' : ''}`;
                groupItem.dataset.groupId = group.id;
                groupItem.style.backgroundColor = group.color; // Apply group color
                groupItem.style.color = getContrastColor(group.color); // Set text color for contrast

                const nameSpan = document.createElement('span');
                nameSpan.textContent = group.name;

                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'group-item-buttons';

                const editButton = document.createElement('button');
                editButton.className = 'edit-group-btn';
                editButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>`;
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-group-btn';
                deleteButton.innerHTML = '&times;';

                buttonsContainer.appendChild(editButton);
                if (group.id !== 'default') {
                    buttonsContainer.appendChild(deleteButton);
                }

                groupItem.appendChild(nameSpan);
                groupItem.appendChild(buttonsContainer);
                groupList.appendChild(groupItem);
            });
        }
    }

    // Helper to get a contrasting text color (black or white)
    function getContrastColor(hexcolor) {
        if (!hexcolor) return 'black'; // Default to black if color is undefined

        // Convert HSL to RGB for contrast calculation
        let r, g, b;
        if (hexcolor.startsWith('hsl')) {
            const hsl = hexcolor.match(/(\d+(\.\d+)?)/g).map(Number);
            const h = hsl[0];
            const s = hsl[1] / 100;
            const l = hsl[2] / 100;

            let c = (1 - Math.abs(2 * l - 1)) * s,
                x = c * (1 - Math.abs((h / 60) % 2 - 1)),
                m = l - c / 2;
            if (0 <= h && h < 60) {
                r = c; g = x; b = 0;
            } else if (60 <= h && h < 120) {
                r = x; g = c; b = 0;
            } else if (120 <= h && h < 180) {
                r = 0; g = c; b = x;
            } else if (180 <= h && h < 240) {
                r = 0; g = x; b = c;
            } else if (240 <= h && h < 300) {
                r = x; g = 0; b = c;
            } else if (300 <= h && h < 360) {
                r = c; g = 0; b = x;
            }
            r = Math.round((r + m) * 255);
            g = Math.round((g + m) * 255);
            b = Math.round((b + m) * 255);
        } else { // Assume hex for simplicity if not HSL
            const c = hexcolor.substring(1); // strip #
            const rgb = parseInt(c, 16); // convert rrggbb to decimal
            r = (rgb >> 16) & 0xff; // extract r
            g = (rgb >> 8) & 0xff; // extract g
            b = (rgb >> 0) & 0xff; // extract b
        }

        // http://www.w3.org/TR/AERT#color-contrast
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (brightness > 180) ? 'black' : 'white';
    }


    // Make group name editable and add color input
    function makeGroupNameEditable(groupItem, groupId) {
        const activeSchool = schools.find(s => s.id === activeSchoolId);
        const group = activeSchool?.groups.find(g => g.id === groupId);
        if (!group) return;

        const nameSpan = groupItem.querySelector('span');
        nameSpan.style.display = 'none';

        const inputContainer = document.createElement('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.alignItems = 'center';
        inputContainer.style.gap = '5px';
        inputContainer.style.flexGrow = '1';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'group-name-input';
        nameInput.value = group.name;
        nameInput.style.flexGrow = '1';
        nameInput.style.minWidth = '50px'; // Ensure it doesn't shrink too much

        const colorInput = document.createElement('input');
        colorInput.type = 'color'; // HTML5 color picker
        colorInput.className = 'group-color-input';
        // Convert HSL to HEX for the color input value
        // Note: This is a simplification. A perfect HSL to HEX conversion for color input type might need a more robust library.
        // For HSL, we might need a custom color picker, or store colors as HEX from the start if using native color picker.
        // For simplicity, let's assume if the color starts with # it's hex, otherwise use a default, or try to convert.
        colorInput.value = group.color.startsWith('#') ? group.color : '#bbdefb'; // Default fallback if HSL.
        colorInput.title = "グループの色を変更";


        inputContainer.appendChild(nameInput);
        inputContainer.appendChild(colorInput);
        groupItem.insertBefore(inputContainer, nameSpan.nextSibling);

        nameInput.focus();
        nameInput.select();

        const finishEditing = (shouldSave) => {
            nameInput.removeEventListener('blur', onBlur);
            nameInput.removeEventListener('keydown', onKeydown);
            colorInput.removeEventListener('change', onChangeColor); // Remove color listener

            const newName = nameInput.value.trim();
            const newColor = colorInput.value; // Get the new color from the input

            if (shouldSave && (newName && newName !== group.name || newColor !== group.color)) {
                if (newName) group.name = newName;
                group.color = newColor; // Update group color
                saveSchools();
                nameSpan.textContent = newName;
            }

            groupItem.removeChild(inputContainer);
            nameSpan.style.display = '';
            renderGroupList();
            renderActiveSchoolContent();
        };

        const onBlur = () => finishEditing(true);
        const onKeydown = (e) => {
            if (e.key === 'Enter') finishEditing(true);
            if (e.key === 'Escape') finishEditing(false);
        };
        const onChangeColor = () => {
            // Apply color immediately for visual feedback
            groupItem.style.backgroundColor = colorInput.value;
            groupItem.style.color = getContrastColor(colorInput.value);
            // No need to save here, save happens on blur/enter
        };


        nameInput.addEventListener('blur', onBlur);
        nameInput.addEventListener('keydown', onKeydown);
        colorInput.addEventListener('change', onChangeColor); // Listen for color changes
    }


    // Delete a group
    function deleteGroup(idToDelete) {
        const activeSchool = schools.find(s => s.id === activeSchoolId);
        if (!activeSchool) return;

        if (idToDelete === 'default') {
            alert('デフォルトグループは削除できません。');
            return;
        }

        if (!activeSchool.groups || activeSchool.groups.length <= 1) {
            alert('最後のグループは削除できません。');
            return;
        }

        const confirmDelete = confirm('このグループを削除してもよろしいですか？\nこのグループに所属する生徒はデフォルトグループに移動されます。');
        if (!confirmDelete) {
            return;
        }

        activeSchool.scores.forEach(score => {
            if (score.groupId === idToDelete) {
                score.groupId = 'default';
            }
        });

        activeSchool.groups = activeSchool.groups.filter(g => g.id !== idToDelete);

        if (activeGroupId === idToDelete) {
            activeGroupId = 'default';
        }
        saveSchools();
        renderGroupList();
        renderActiveSchoolContent();
    }


    // Render group average results
    function renderGroupAverageResults(groupAverages) {
        groupAverageResults.innerHTML = '';
        if (!groupAverages || typeof groupAverages !== 'object' || Object.keys(groupAverages).length === 0) {
            groupAverageResults.innerHTML = '<p>グループごとの平均点はまだ計算されていません。</p>';
            return;
        }

        const ul = document.createElement('ul');
        for (const groupId in groupAverages) {
            const avg = groupAverages[groupId];
            const activeSchool = schools.find(s => s.id === activeSchoolId);
            const group = activeSchool?.groups.find(g => g.id === groupId);
            const groupName = group?.name || '不明なグループ';
            const groupColor = group?.color || '#bbdefb'; // Fallback color

            const li = document.createElement('li');
            li.innerHTML = `<strong>${groupName}:</strong> <span>${avg.count > 0 ? `${avg.average.toFixed(2)} 点 (${avg.count}名)` : '対象なし'}</span>`;
            li.style.backgroundColor = groupColor; // Apply group color
            li.style.color = getContrastColor(groupColor); // Set text color for contrast
            ul.appendChild(li);
        }
        const h4 = document.createElement('h4');
        h4.textContent = 'グループ別平均点:';
        groupAverageResults.appendChild(h4);
        groupAverageResults.appendChild(ul);
    }


    newSchoolButton.addEventListener('click', () => createNewSchool());

    newGroupButton.addEventListener('click', () => createNewGroup());


    calculateButton.addEventListener('click', () => {
        const activeSchool = schools.find(s => s.id === activeSchoolId);
        if (!activeSchool) return;

        const validScores = activeSchool.scores
            .filter(score => !score.notTaken && score.value !== null && !isNaN(score.value))
            .map(score => score.value);

        if (validScores.length < 4) {
            activeSchool.currentScoresDisplay = validScores.length > 0 ? `対象: ${validScores.join(', ')} 点` : "なし";
            const sum = validScores.reduce((acc, current) => acc + current, 0);
            const average = validScores.length > 0 ? (sum / validScores.length) : 0;
            activeSchool.currentAverageResult = validScores.length > 0 ? `平均点: ${average.toFixed(2)} 点` : "有効な点数を入力してください";
            if (validScores.length > 0 && validScores.length < 4) {
                activeSchool.currentAverageResult += ' (データが4件未満のため詳細な統計は表示されません)';
            }
            activeSchool.statistics = null;
        } else {
            const sum = validScores.reduce((acc, current) => acc + current, 0);
            const average = (sum / validScores.length);

            activeSchool.currentScoresDisplay = `対象: ${validScores.join(', ')} 点`;
            activeSchool.currentAverageResult = `平均点: ${average.toFixed(2)} 点`;

            const sortedScores = [...validScores].sort((a, b) => a - b);

            activeSchool.statistics = {
                min: sortedScores[0],
                q1: getQuantile(sortedScores, 0.25),
                median: getQuantile(sortedScores, 0.5),
                q3: getQuantile(sortedScores, 0.75),
                max: sortedScores[sortedScores.length - 1]
            };
        }

        activeSchool.groupAverages = {};
        const groupsToProcess = activeSchool.groups || [];
        groupsToProcess.forEach(group => {
            const groupScores = activeSchool.scores
                .filter(score => !score.notTaken && score.value !== null && !isNaN(score.value) && score.groupId === group.id)
                .map(score => score.value);

            const groupSum = groupScores.reduce((acc, current) => acc + current, 0);
            const groupAverage = groupScores.length > 0 ? (groupSum / groupScores.length) : 0;
            activeSchool.groupAverages[group.id] = {
                average: groupAverage,
                count: groupScores.length,
                scores: groupScores
            };
        });

        saveSchools();
        renderActiveSchoolContent();
    });

    function getQuantile(sortedArray, q) {
        const pos = (sortedArray.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (sortedArray[base + 1] !== undefined) {
            return sortedArray[base] + rest * (sortedArray[base + 1] - sortedArray[base]);
        } else {
            return sortedArray[base];
        }
    }

    function drawBoxPlot(stats) {
        const svg = document.getElementById('boxplot-svg');
        if (!svg) {
            console.warn("Boxplot SVG element not found. Skipping drawing.");
            return;
        }

        svg.innerHTML = '';

        const width = svg.clientWidth;
        const height = svg.clientHeight;
        const plotAreaHeight = 50;
        const yCenter = plotAreaHeight / 2;
        const boxHeight = plotAreaHeight * 0.6;

        const scale = (value) => (value / 100) * width;

        const createSvgElement = (tag, attributes) => {
            const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (const key in attributes) {
                el.setAttribute(key, attributes[key]);
            }
            return el;
        };

        const createLabel = (value, x) => {
            const text = createSvgElement('text', {
                x: x,
                y: plotAreaHeight + 15,
                class: 'boxplot-label'
            });
            text.textContent = value.toFixed(1);
            return text;
        };

        const minX = scale(stats.min);
        const q1X = scale(stats.q1);
        const medianX = scale(stats.median);
        const q3X = scale(stats.q3);
        const maxX = scale(stats.max);

        svg.appendChild(createSvgElement('line', { x1: minX, y1: yCenter, x2: q1X, y2: yCenter, class: 'boxplot-line' }));
        svg.appendChild(createSvgElement('line', { x1: q3X, y1: yCenter, x2: maxX, y2: yCenter, class: 'boxplot-line' }));

        svg.appendChild(createSvgElement('rect', { x: q1X, y: (plotAreaHeight - boxHeight) / 2, width: q3X - q1X, height: boxHeight, class: 'boxplot-box' }));

        svg.appendChild(createSvgElement('line', { x1: medianX, y1: (plotAreaHeight - boxHeight) / 2, x2: medianX, y2: (plotAreaHeight + boxHeight) / 2, class: 'boxplot-median' }));

        svg.appendChild(createSvgElement('line', { x1: minX, y1: yCenter - 10, x2: minX, y2: yCenter + 10, class: 'boxplot-line' }));
        svg.appendChild(createSvgElement('line', { x1: maxX, y1: yCenter - 10, x2: maxX, y2: yCenter + 10, class: 'boxplot-line' }));

        svg.appendChild(createLabel(stats.min, minX));
        svg.appendChild(createLabel(stats.q1, q1X));
        svg.appendChild(createLabel(stats.median, medianX));
        svg.appendChild(createLabel(stats.q3, q3X));
        svg.appendChild(createLabel(stats.max, maxX));
    }

    loadSchools();
});
