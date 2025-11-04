// API 기본 URL
const API_URL = 'http://localhost:5174/api/todos';

// DOM 요소
const todoForm = document.getElementById('todoForm');
const todoList = document.getElementById('todoList');
const loading = document.getElementById('loading');
const emptyMessage = document.getElementById('emptyMessage');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');

// 모든 할일 삭제 함수
async function deleteAllTodos() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            console.error('할일 목록을 가져올 수 없습니다.');
            return;
        }
        
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            console.log(`${result.data.length}개의 할일을 삭제합니다...`);
            // 모든 할일 삭제
            const deletePromises = result.data.map(async (todo) => {
                try {
                    const deleteResponse = await fetch(`${API_URL}/${todo._id}`, { 
                        method: 'DELETE' 
                    });
                    return await deleteResponse.json();
                } catch (err) {
                    console.error(`할일 ${todo._id} 삭제 실패:`, err);
                    return null;
                }
            });
            
            await Promise.all(deletePromises);
            console.log('✅ 모든 할일이 삭제되었습니다.');
        } else {
            console.log('삭제할 할일이 없습니다.');
        }
    } catch (error) {
        console.error('❌ 할일 삭제 오류:', error);
    }
}

// 페이지 로드 시 모든 할일 삭제 후 목록 불러오기
document.addEventListener('DOMContentLoaded', async () => {
    // 새로고침할 때마다 모든 할일 삭제
    await deleteAllTodos();
    // 삭제 완료 후 목록 불러오기
    setTimeout(() => {
        loadTodos();
    }, 500); // 삭제 완료를 위한 짧은 대기
});

// 할일 생성 폼 제출
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();

    if (!title) {
        alert('할일 제목을 입력해주세요.');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                description,
                completed: false
            })
        });

        const result = await response.json();

        if (result.success) {
            todoForm.reset();
            loadTodos();
            alert('할일이 추가되었습니다!');
        } else {
            alert('할일 추가 실패: ' + result.message);
        }
    } catch (error) {
        console.error('할일 추가 오류:', error);
        alert('할일 추가 중 오류가 발생했습니다.');
    }
});

// 할일 목록 불러오기
async function loadTodos() {
    loading.style.display = 'block';
    todoList.innerHTML = '';
    emptyMessage.style.display = 'none';

    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();

        loading.style.display = 'none';

        if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
            result.data.forEach(todo => {
                renderTodo(todo);
            });
        } else {
            emptyMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('할일 목록 불러오기 오류:', error);
        loading.style.display = 'none';
        emptyMessage.style.display = 'block';
        emptyMessage.textContent = '할일 목록을 불러오는 중 오류가 발생했습니다. 서버를 확인해주세요.';
    }
}

// 할일 아이템 렌더링
function renderTodo(todo) {
    const todoItem = document.createElement('div');
    todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    todoItem.id = `todo-${todo._id}`;

    const createdAt = new Date(todo.createdAt).toLocaleString('ko-KR');

    todoItem.innerHTML = `
        <div class="todo-header">
            <div class="todo-title">${escapeHtml(todo.title)}</div>
            <div class="todo-actions">
                <button class="btn btn-edit" onclick="openEditModal('${todo._id}')">수정</button>
                <button class="btn btn-danger" onclick="deleteTodo('${todo._id}')">삭제</button>
            </div>
        </div>
        ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
        <div class="todo-meta">
            <span class="todo-status ${todo.completed ? 'completed' : 'pending'}">
                ${todo.completed ? '완료' : '진행중'}
            </span>
            <span>생성일: ${createdAt}</span>
        </div>
    `;

    todoList.appendChild(todoItem);
}

// 할일 수정 모달 열기
async function openEditModal(id) {
    try {
        // 모든 할일 목록에서 해당 할일 찾기
        const response = await fetch(API_URL);
        const result = await response.json();

        if (!result.success) {
            alert('할일 정보를 불러올 수 없습니다.');
            return;
        }

        const todo = result.data.find(t => t._id === id);

        if (!todo) {
            alert('할일을 찾을 수 없습니다.');
            return;
        }

        document.getElementById('editId').value = todo._id;
        document.getElementById('editTitle').value = todo.title;
        document.getElementById('editDescription').value = todo.description || '';
        document.getElementById('editCompleted').checked = todo.completed;

        editModal.style.display = 'flex';
    } catch (error) {
        console.error('할일 정보 불러오기 오류:', error);
        alert('할일 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// 할일 수정 모달 닫기
function closeEditModal() {
    editModal.style.display = 'none';
    editForm.reset();
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    if (event.target === editModal) {
        closeEditModal();
    }
}

// 닫기 버튼 클릭
document.querySelector('.close').addEventListener('click', closeEditModal);

// 할일 수정 폼 제출
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const title = document.getElementById('editTitle').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const completed = document.getElementById('editCompleted').checked;

    if (!title) {
        alert('할일 제목을 입력해주세요.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                description,
                completed
            })
        });

        const result = await response.json();

        if (result.success) {
            closeEditModal();
            loadTodos();
            alert('할일이 수정되었습니다!');
        } else {
            alert('할일 수정 실패: ' + result.message);
        }
    } catch (error) {
        console.error('할일 수정 오류:', error);
        alert('할일 수정 중 오류가 발생했습니다.');
    }
});

// 할일 삭제
async function deleteTodo(id) {
    if (!confirm('정말로 이 할일을 삭제하시겠습니까?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            loadTodos();
            alert('할일이 삭제되었습니다!');
        } else {
            alert('할일 삭제 실패: ' + result.message);
        }
    } catch (error) {
        console.error('할일 삭제 오류:', error);
        alert('할일 삭제 중 오류가 발생했습니다.');
    }
}

// XSS 방지를 위한 HTML 이스케이프 함수
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

