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

    let filesData = [];
    let activeFileIndex = -1;

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
            const content = e.target.result;
            renderMarkdown(content);
        };
        reader.readAsText(file);
    }

    // Markdownのレンダリング
    function renderMarkdown(content) {
        const html = marked.parse(content);
        
        markdownBody.innerHTML = html;
        
        dropZone.classList.add('hidden');
        markdownBody.classList.remove('hidden');

        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });

        // スムーズにトップへスクロール
        const viewer = document.querySelector('.viewer-container');
        if (viewer) {
            viewer.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
});
