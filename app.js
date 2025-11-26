let editingId = null;
let deleteId = null;
let currentSort = { field: null, order: 'asc' };

document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicación iniciada');
    loadTableData();
    setupEventListeners();
    updateStats();
});

function setupEventListeners() {
    const form = document.getElementById('employeeForm');
    form.addEventListener('submit', handleFormSubmit);

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchRecords();
        }
    });

    searchInput.addEventListener('input', function() {
        if (this.value.length > 2 || this.value.length === 0) {
            searchRecords();
        }
    });

    const emailInput = document.getElementById('email');
    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        if (email && !db.validateEmail(email)) {
            this.style.borderColor = '#dc3545';
            showMessage('⚠️ Formato de email inválido', 'error');
        } else {
            this.style.borderColor = '#ddd';
        }
    });

    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value.length <= 3) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        }
        
        e.target.value = value;
    });

    window.onclick = function(event) {
        const modal = document.getElementById('confirmModal');
        if (event.target === modal) {
            closeModal();
        }
    };

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        department: document.getElementById('department').value,
        position: document.getElementById('position').value.trim(),
        salary: parseFloat(document.getElementById('salary').value) || 0,
        hireDate: document.getElementById('hireDate').value,
        status: document.getElementById('status').value
    };

    const validation = db.validateRecord(formData);
    if (!validation.isValid) {
        showMessage('❌ ' + validation.errors.join('<br>'), 'error');
        return;
    }

    try {
        if (editingId) {
            db.updateRecord(editingId, formData);
            showMessage('✅ Registro actualizado exitosamente', 'success');
            editingId = null;
        } else {
            db.createRecord(formData);
            showMessage('✅ Registro creado exitosamente', 'success');
        }

        resetForm();
        loadTableData();
        updateStats();
    } catch (error) {
        showMessage('❌ Error: ' + error.message, 'error');
        console.error('Error al guardar:', error);
    }
}

function loadTableData(data = null) {
    const tbody = document.getElementById('tableBody');
    const records = data || db.getAllRecords();

    if (!records || records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="no-data">
                    📋 No hay registros para mostrar
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = records.map(record => `
        <tr class="fade-in">
            <td><strong>${record.id}</strong></td>
            <td>${escapeHtml(record.name)}</td>
            <td>${escapeHtml(record.email)}</td>
            <td>${escapeHtml(record.phone) || '<span style="color: #999;">N/A</span>'}</td>
            <td>${escapeHtml(record.department)}</td>
            <td>${escapeHtml(record.position)}</td>
            <td><strong>$${formatNumber(record.salary)}</strong></td>
            <td>
                <span class="status-badge status-${record.status.toLowerCase().replace(/\s/g, '')}">
                    ${escapeHtml(record.status)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button onclick="editRecord(${record.id})" class="btn-edit" title="Editar registro">
                        ✏️ Editar
                    </button>
                    <button onclick="showDeleteConfirm(${record.id})" class="btn-delete" title="Eliminar registro">
                        🗑️ Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function editRecord(id) {
    const record = db.getRecordById(id);
    
    if (!record) {
        showMessage('❌ Registro no encontrado', 'error');
        return;
    }

    document.getElementById('employeeId').value = record.id;
    document.getElementById('name').value = record.name;
    document.getElementById('email').value = record.email;
    document.getElementById('phone').value = record.phone || '';
    document.getElementById('department').value = record.department;
    document.getElementById('position').value = record.position;
    document.getElementById('salary').value = record.salary;
    document.getElementById('hireDate').value = record.hireDate;
    document.getElementById('status').value = record.status;

    editingId = id;
    document.getElementById('formTitle').textContent = `Editar Empleado (ID: ${id})`;
    
    document.querySelector('.form-section').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });

    const formSection = document.querySelector('.form-section');
    formSection.style.backgroundColor = '#fff3cd';
    setTimeout(() => {
        formSection.style.backgroundColor = '#ffffff';
    }, 1000);
}

function showDeleteConfirm(id) {
    const record = db.getRecordById(id);
    if (!record) {
        showMessage('❌ Registro no encontrado', 'error');
        return;
    }

    deleteId = id;
    
    const modalContent = document.querySelector('.modal-content');
    const recordInfo = `
        <div class="modal-header">
            <h3>⚠️ Confirmar Eliminación</h3>
            <button onclick="closeModal()" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
            <p>¿Está seguro de que desea eliminar este registro?</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <strong>ID:</strong> ${record.id}<br>
                <strong>Nombre:</strong> ${record.name}<br>
                <strong>Email:</strong> ${record.email}<br>
                <strong>Departamento:</strong> ${record.department}
            </div>
            <p class="warning">⚠️ Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-buttons">
            <button onclick="confirmDelete()" class="btn-danger">🗑️ Sí, Eliminar</button>
            <button onclick="closeModal()" class="btn-secondary">❌ Cancelar</button>
        </div>
    `;
    modalContent.innerHTML = recordInfo;
    
    document.getElementById('confirmModal').style.display = 'block';
}

function confirmDelete() {
    if (!deleteId) {
        closeModal();
        return;
    }

    try {
        const record = db.getRecordById(deleteId);
        db.deleteRecord(deleteId);
        showMessage(`✅ Registro de "${record.name}" eliminado exitosamente`, 'success');
        loadTableData();
        updateStats();
        closeModal();
    } catch (error) {
        showMessage('❌ Error al eliminar: ' + error.message, 'error');
        console.error('Error al eliminar:', error);
    }
}

function closeModal() {
    document.getElementById('confirmModal').style.display = 'none';
    deleteId = null;
}

function cancelEdit() {
    if (editingId) {
        const confirmCancel = confirm('¿Desea cancelar la edición? Los cambios no guardados se perderán.');
        if (!confirmCancel) return;
    }
    resetForm();
    showMessage('✏️ Edición cancelada', 'success');
}

function resetForm() {
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeId').value = '';
    editingId = null;
    document.getElementById('formTitle').textContent = 'Agregar Nuevo Empleado';
    
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.style.borderColor = '#ddd';
    });
}

function searchRecords() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (query === '') {
        loadTableData();
        updateStats();
        return;
    }

    const results = db.searchRecords(query);
    loadTableData(results);
    
    document.getElementById('totalRecords').textContent = results.length;
    
    if (results.length === 0) {
        showMessage(`🔍 No se encontraron resultados para: "${query}"`, 'error');
    } else {
        showMessage(`✅ Se encontraron ${results.length} resultado(s)`, 'success');
    }
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    loadTableData();
    updateStats();
    showMessage('🔍 Búsqueda limpiada', 'success');
}

function updateStats() {
    const stats = db.getStats();
    document.getElementById('totalRecords').textContent = stats.total;
    
    const activeEl = document.getElementById('activeRecords');
    const vacationEl = document.getElementById('vacationRecords');
    const deptEl = document.getElementById('departmentCount');
    
    if (activeEl) activeEl.textContent = stats.active;
    if (vacationEl) vacationEl.textContent = stats.onVacation;
    if (deptEl) deptEl.textContent = stats.departments;
}

function showMessage(message, type) {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = message;

    const formSection = document.querySelector('.form-section');
    formSection.insertBefore(messageDiv, formSection.firstChild);

    setTimeout(() => {
        if (messageDiv && messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);

    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatNumber(num) {
    if (!num || isNaN(num)) return '0.00';
    
    return new Intl.NumberFormat('es-DO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function exportData() {
    try {
        const jsonData = db.exportToJSON();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `empleados_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('✅ Datos exportados exitosamente', 'success');
    } catch (error) {
        showMessage('❌ Error al exportar datos', 'error');
        console.error('Error al exportar:', error);
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const success = db.importFromJSON(event.target.result);
                
                if (success) {
                    showMessage('✅ Datos importados exitosamente', 'success');
                    loadTableData();
                    updateStats();
                } else {
                    showMessage('❌ Error: Formato de datos inválido', 'error');
                }
            } catch (error) {
                showMessage('❌ Error al importar datos: ' + error.message, 'error');
                console.error('Error al importar:', error);
            }
        };
        
        reader.onerror = function() {
            showMessage('❌ Error al leer el archivo', 'error');
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function filterByDepartment(department) {
    if (department === 'all' || !department) {
        loadTableData();
        showMessage('🔍 Mostrando todos los departamentos', 'success');
    } else {
        const filtered = db.filterByDepartment(department);
        loadTableData(filtered);
        showMessage(`🔍 Filtrando por: ${department} (${filtered.length} resultados)`, 'success');
    }
}

function filterByStatus(status) {
    if (status === 'all' || !status) {
        loadTableData();
        showMessage('🔍 Mostrando todos los estados', 'success');
    } else {
        const filtered = db.filterByStatus(status);
        loadTableData(filtered);
        showMessage(`🔍 Filtrando por: ${status} (${filtered.length} resultados)`, 'success');
    }
}

function sortTable(field) {
    if (currentSort.field === field) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.order = 'asc';
    }
    
    const sorted = db.sortRecords(field, currentSort.order);
    loadTableData(sorted);
    
    const orderText = currentSort.order === 'asc' ? '↑ Ascendente' : '↓ Descendente';
    showMessage(`📊 Ordenado por ${field} ${orderText}`, 'success');
}

function clearAllData() {
    const confirmText = prompt(
        'Esta acción eliminará TODOS los registros.\n\n' +
        'Para confirmar, escriba: ELIMINAR TODO'
    );
    
    if (confirmText === 'ELIMINAR TODO') {
        db.clearDatabase();
        db.initialize();
        loadTableData();
        updateStats();
        showMessage('✅ Base de datos reiniciada con datos de ejemplo', 'success');
    } else if (confirmText !== null) {
        showMessage('❌ Operación cancelada', 'error');
    }
}

function printTable() {
    const printContent = document.querySelector('.table-section').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <div style="padding: 20px;">
            <h1 style="text-align: center;">📋 Reporte de Empleados</h1>
            <p style="text-align: center;">Fecha: ${new Date().toLocaleDateString('es-DO')}</p>
            <hr>
            ${printContent}
        </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    location.reload();
}

function generateReport() {
    const stats = db.getStats();
    const records = db.getAllRecords();
    
    let report = `
╔═══════════════════════════════════════════════════════════╗
║            📊 REPORTE DE EMPLEADOS                        ║
╚═══════════════════════════════════════════════════════════╝

👨‍💻 Desarrollado por: Arowarlin Suarez
🎓 Matrícula: 100679806
🏛️ Universidad: UASD

📅 Fecha: ${new Date().toLocaleString('es-DO')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 ESTADÍSTICAS GENERALES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   • Total de empleados: ${stats.total}
   • Empleados activos: ${stats.active}
   • Empleados inactivos: ${stats.inactive}
   • En vacaciones: ${stats.onVacation}
   • Departamentos: ${stats.departments}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 LISTADO DETALLADO DE EMPLEADOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    
    records.forEach((record, index) => {
        report += `
┌─────────────────────────────────────────────────────────┐
│ EMPLEADO #${index + 1} (ID: ${record.id})
├─────────────────────────────────────────────────────────┤
│ 👤 Nombre: ${record.name}
│ 📧 Email: ${record.email}
│ 📱 Teléfono: ${record.phone || 'N/A'}
│ 🏢 Departamento: ${record.department}
│ 💼 Cargo: ${record.position}
│ 💵 Salario: $${formatNumber(record.salary)}
│ ⭐ Estado: ${record.status}
│ 📅 Fecha de Contratación: ${record.hireDate || 'N/A'}
└─────────────────────────────────────────────────────────┘
        `;
    });
    
    report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fin del Reporte - Sistema CRUD v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    
    console.log(report);
    alert('📊 Reporte generado exitosamente!\n\n✅ Revisa la consola del navegador (F12) para ver el reporte completo.');
}

function showSystemInfo() {
    const stats = db.getStats();
    const info = `
╔════════════════════════════════════════════════╗
║     🖥️  INFORMACIÓN DEL SISTEMA                ║
╚════════════════════════════════════════════════╝

👨‍💻 DESARROLLADOR:
   Nombre: Arowarlin Suarez
   Matrícula: 100679806
   Universidad: UASD (Universidad Autónoma de Santo Domingo)

📊 ESTADÍSTICAS:
   • Total de registros: ${stats.total}
   • Activos: ${stats.active}
   • Inactivos: ${stats.inactive}
   • En vacaciones: ${stats.onVacation}
   • Departamentos: ${stats.departments}

💾 ALMACENAMIENTO:
   • Tipo: Memoria del navegador (RAM)
   • Persistencia: Sesión actual
   • Capacidad: Ilimitada (según RAM disponible)

🔧 TECNOLOGÍAS:
   • Frontend: HTML5, CSS3, JavaScript ES6
   • Base de Datos: Simulada en memoria
   • Diseño: Responsive & Mobile-First

📦 VERSIÓN: 1.0.0
📅 Año: 2025

═══════════════════════════════════════════════
    `;
    
    alert(info);
}

console.log('%c╔═══════════════════════════════════════════════════╗', 'color: #667eea; font-weight: bold;');
console.log('%c║   🚀 SISTEMA CRUD INICIALIZADO                    ║', 'color: #667eea; font-size: 16px; font-weight: bold;');
console.log('%c╚═══════════════════════════════════════════════════╝', 'color: #667eea; font-weight: bold;');
console.log('%c👨‍💻 Desarrollador: Arowarlin Suarez', 'color: #764ba2; font-weight: bold;');
console.log('%c🎓 Matrícula: 100679806', 'color: #764ba2; font-weight: bold;');
console.log('%c🏛️ Universidad: UASD', 'color: #764ba2; font-weight: bold;');
console.log('%c\n📌 Comandos disponibles:', 'color: #28a745; font-weight: bold;');
console.log('   • exportData() - Exportar datos a JSON');
console.log('   • importData() - Importar datos desde JSON');
console.log('   • clearAllData() - Limpiar base de datos');
console.log('   • generateReport() - Generar reporte completo');
console.log('   • showSystemInfo() - Información del sistema');
console.log('%c\n✅ Sistema listo para usar!', 'color: #28a745; font-weight: bold; font-size: 14px;');