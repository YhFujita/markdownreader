document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const folderInput = document.getElementById('folder-input');
    const selectBtn = document.getElementById('select-btn');
    const folderBtn = document.getElementById('folder-btn');
    const dropZone = document.getElementById('drop-zone');
    const markdownBody = document.getElementById('markdown-body');
    const sidebar = document.getElementById('sidebar');
    const fileListElement = document.getElementById('file-list');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const editModeBtn = document.getElementById('edit-mode-btn');
    const previewModeBtn = document.getElementById('preview-mode-btn');
    const editorContainer = document.getElementById('editor-container');
    const markdownEditor = document.getElementById('markdown-editor');

    let filesData = [];
    let activeFileIndex = -1;
    let isEditMode = false;
    let currentFileContent = '';

    // marked.js の設定
    marked.setOptions({
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-',
        headerIds: true,
        gfm: true,
        breaks: true
    });

    // ファイル選択ボタンのクリック
    selectBtn.addEventListener('click', () => {
        fileInput.value = ''; // 選択をリセット
        fileInput.click();
    });

    // サイドバーのトグルボタンのクリック
    toggleSidebarBtn.addEventListener('click', () => {
        // ファイルが1つ以上読み込まれていて、sidebarが完全に隠れていない(hiddenがない)場合のみ動作する
        if (!sidebar.classList.contains('hidden')) {
            sidebar.classList.toggle('collapsed');
        }
    });

    // フォルダ選択ボタンのクリック
    folderBtn.addEventListener('click', () => {
        folderInput.value = ''; // 選択をリセット
        folderInput.click();
    });

    // ファイル入力の変更
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // フォルダ入力の変更
    folderInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // ドラッグ＆ドロップのイベント
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('active');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('active');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        handleFiles(dt.files);
    });

    // ファイル群の処理
    function handleFiles(files) {
        if (!files || files.length === 0) return;

        let newFiles = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Markdownファイルのみ抽出
            if (file.name.endsWith('.md') || file.type === 'text/markdown') {
                newFiles.push({
                    name: file.webkitRelativePath || file.name, // フォルダ選択時は相対パスを使用
                    file: file
                });
            }
        }

        if (newFiles.length === 0) {
            alert('Markdownファイルが見つかりませんでした。');
            return;
        }

        // 新しく読み込んだファイルでリストを上書き
        filesData = newFiles;
        activeFileIndex = 0;

        // サイドバーを表示
        sidebar.classList.remove('hidden');

        updateFileList();
        loadFileContent(filesData[activeFileIndex].file);
    }

    // ファイルリストの更新
    function updateFileList() {
        fileListElement.innerHTML = '';
        filesData.forEach((fileData, index) => {
            const li = document.createElement('li');
            li.textContent = fileData.name;
            li.title = fileData.name; // ホバーでフルパスを確認可能にする
            
            if (index === activeFileIndex) {
                li.classList.add('active');
            }
            
            li.addEventListener('click', () => {
                activeFileIndex = index;
                updateFileList(); // activeクラスを再適用
                loadFileContent(fileData.file);
            });
            
            fileListElement.appendChild(li);
        });
    }

    // ファイルの読み込みと表示
    function loadFileContent(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentFileContent = e.target.result;
            
            // UI更新
            editModeBtn.classList.remove('hidden');
            previewModeBtn.classList.add('hidden');
            isEditMode = false;
            
            renderMarkdown(currentFileContent);
        };
        reader.readAsText(file);
    }

    // Markdownのレンダリング
    function renderMarkdown(content) {
        const html = marked.parse(content);
        
        markdownBody.innerHTML = html;
        
        dropZone.classList.add('hidden');
        editorContainer.classList.add('hidden');
        markdownBody.classList.remove('hidden');

        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });

        makeTablesResizable();

        // スムーズにトップへスクロール
        const viewer = document.querySelector('.viewer-container');
        if (viewer) {
            viewer.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // 編集・プレビューモード切り替え
    editModeBtn.addEventListener('click', () => {
        isEditMode = true;
        editModeBtn.classList.add('hidden');
        previewModeBtn.classList.remove('hidden');
        
        markdownBody.classList.add('hidden');
        editorContainer.classList.remove('hidden');
        
        markdownEditor.value = currentFileContent;
    });

    previewModeBtn.addEventListener('click', () => {
        isEditMode = false;
        previewModeBtn.classList.add('hidden');
        editModeBtn.classList.remove('hidden');
        
        currentFileContent = markdownEditor.value;
        renderMarkdown(currentFileContent);
    });

    // テキスト挿入ヘルパー
    function insertTextAtCursor(textarea, prefix, suffix, defaultText) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end) || defaultText;
        
        const replacement = prefix + selectedText + suffix;
        textarea.value = text.substring(0, start) + replacement + text.substring(end);
        
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
        
        // 保存用に内容を更新
        currentFileContent = textarea.value;
    }

    document.getElementById('btn-bold').addEventListener('click', () => {
        insertTextAtCursor(markdownEditor, '**', '**', '太字');
    });

    document.getElementById('btn-h1').addEventListener('click', () => {
        insertTextAtCursor(markdownEditor, '# ', '', '見出し1');
    });

    document.getElementById('btn-h2').addEventListener('click', () => {
        insertTextAtCursor(markdownEditor, '## ', '', '見出し2');
    });

    document.getElementById('btn-table').addEventListener('click', () => {
        const tableTemplate = `\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n`;
        insertTextAtCursor(markdownEditor, '', tableTemplate, '');
    });

    document.getElementById('btn-save').addEventListener('click', () => {
        if (activeFileIndex === -1) return;
        
        const content = isEditMode ? markdownEditor.value : currentFileContent;
        const fileName = filesData[activeFileIndex].name.split('/').pop();
        
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        currentFileContent = content;
    });

    // テーブルのリサイズ機能
    function makeTablesResizable() {
        const tables = document.querySelectorAll('.markdown-body table');
        tables.forEach(table => {
            if (table.classList.contains('resizable')) return;
            table.classList.add('resizable');

            const headers = Array.from(table.querySelectorAll('th'));
            
            headers.forEach(th => {
                th.style.width = window.getComputedStyle(th).width;
            });
            table.style.width = window.getComputedStyle(table).width;
            table.style.tableLayout = 'fixed';
            
            headers.forEach((th) => {
                const resizer = document.createElement('div');
                resizer.classList.add('resizer');
                th.appendChild(resizer);

                let startX, startWidth, startTableWidth;

                const onMouseDown = function(e) {
                    startX = e.clientX;
                    startWidth = parseInt(window.getComputedStyle(th).width, 10);
                    startTableWidth = parseInt(window.getComputedStyle(table).width, 10);

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                    resizer.classList.add('resizing');
                };

                const onMouseMove = function(e) {
                    const dx = e.clientX - startX;
                    th.style.width = `${startWidth + dx}px`;
                    table.style.width = `${startTableWidth + dx}px`;
                };

                const onMouseUp = function() {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    resizer.classList.remove('resizing');
                };

                resizer.addEventListener('mousedown', onMouseDown);
            });
        });
    }
});
