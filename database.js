// Simulación de Base de Datos usando almacenamiento en memoria
// En una aplicación real, esto se conectaría a una BD real (MySQL, MongoDB, etc.)

class Database {
    constructor() {
        this.storageKey = 'employeeDatabase';
        this.initialize();
    }

    // Inicializar la base de datos
    initialize() {
        if (!this.getAllRecords()) {
            // Datos de ejemplo iniciales
            const initialData = [
                {
                    id: 1,
                    name: "Juan Pérez",
                    email: "juan.perez@empresa.com",
                    phone: "(809) 555-0101",
                    department: "Tecnología",
                    position: "Desarrollador Senior",
                    salary: 75000,
                    hireDate: "2020-03-15",
                    status: "Activo",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: "María García",
                    email: "maria.garcia@empresa.com",
                    phone: "(809) 555-0102",
                    department: "Recursos Humanos",
                    position: "Gerente de RRHH",
                    salary: 85000,
                    hireDate: "2019-06-20",
                    status: "Activo",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    name: "Carlos Rodríguez",
                    email: "carlos.rodriguez@empresa.com",
                    phone: "(809) 555-0103",
                    department: "Ventas",
                    position: "Ejecutivo de Ventas",
                    salary: 55000,
                    hireDate: "2021-01-10",
                    status: "Vacaciones",
                    createdAt: new Date().toISOString()
                }
            ];
            this.saveToStorage(initialData);
        }
    }

    // Guardar en memoria del navegador
    saveToStorage(data) {
        const db = {
            employees: data,
            lastUpdated: new Date().toISOString(),
            version: "1.0"
        };
        window.dbData = db;
    }

    // Obtener todos los registros
    getAllRecords() {
        if (!window.dbData) {
            return null;
        }
        return window.dbData.employees;
    }

    // Obtener un registro por ID
    getRecordById(id) {
        const records = this.getAllRecords();
        return records.find(record => record.id === parseInt(id));
    }

    // Crear un nuevo registro
    createRecord(data) {
        const records = this.getAllRecords();
        
        // Generar nuevo ID
        const newId = records.length > 0 
            ? Math.max(...records.map(r => r.id)) + 1 
            : 1;

        const newRecord = {
            id: newId,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        records.push(newRecord);
        this.saveToStorage(records);
        
        return newRecord;
    }

    // Actualizar un registro existente
    updateRecord(id, data) {
        const records = this.getAllRecords();
        const index = records.findIndex(record => record.id === parseInt(id));

        if (index === -1) {
            throw new Error('Registro no encontrado');
        }

        records[index] = {
            ...records[index],
            ...data,
            id: parseInt(id), // Mantener el ID original
            updatedAt: new Date().toISOString()
        };

        this.saveToStorage(records);
        return records[index];
    }

    // Eliminar un registro
    deleteRecord(id) {
        let records = this.getAllRecords();
        const initialLength = records.length;
        
        records = records.filter(record => record.id !== parseInt(id));
        
        if (records.length === initialLength) {
            throw new Error('Registro no encontrado');
        }

        this.saveToStorage(records);
        return true;
    }

    // Buscar registros
    searchRecords(query) {
        const records = this.getAllRecords();
        const searchTerm = query.toLowerCase();

        return records.filter(record => {
            return (
                record.name.toLowerCase().includes(searchTerm) ||
                record.email.toLowerCase().includes(searchTerm) ||
                record.department.toLowerCase().includes(searchTerm) ||
                record.position.toLowerCase().includes(searchTerm) ||
                (record.phone && record.phone.includes(searchTerm))
            );
        });
    }

    // Obtener estadísticas
    getStats() {
        const records = this.getAllRecords();
        
        return {
            total: records.length,
            active: records.filter(r => r.status === 'Activo').length,
            inactive: records.filter(r => r.status === 'Inactivo').length,
            onVacation: records.filter(r => r.status === 'Vacaciones').length,
            departments: [...new Set(records.map(r => r.department))].length
        };
    }

    // Filtrar por departamento
    filterByDepartment(department) {
        const records = this.getAllRecords();
        return records.filter(record => record.department === department);
    }

    // Filtrar por estado
    filterByStatus(status) {
        const records = this.getAllRecords();
        return records.filter(record => record.status === status);
    }

    // Ordenar registros
    sortRecords(field, order = 'asc') {
        const records = this.getAllRecords();
        
        return records.sort((a, b) => {
            let valueA = a[field];
            let valueB = b[field];

            // Manejar diferentes tipos de datos
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }

            if (order === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
    }

    // Exportar datos a JSON
    exportToJSON() {
        const data = {
            database: this.getAllRecords(),
            exportDate: new Date().toISOString(),
            stats: this.getStats()
        };
        
        return JSON.stringify(data, null, 2);
    }

    // Importar datos desde JSON
    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.database && Array.isArray(data.database)) {
                this.saveToStorage(data.database);
                return true;
            }
            throw new Error('Formato de datos inválido');
        } catch (error) {
            console.error('Error al importar datos:', error);
            return false;
        }
    }

    // Limpiar toda la base de datos
    clearDatabase() {
        this.saveToStorage([]);
        return true;
    }

    // Validar datos antes de guardar
    validateRecord(data) {
        const errors = [];

        if (!data.name || data.name.trim() === '') {
            errors.push('El nombre es requerido');
        }

        if (!data.email || data.email.trim() === '') {
            errors.push('El email es requerido');
        } else if (!this.validateEmail(data.email)) {
            errors.push('El formato del email es inválido');
        }

        if (!data.department || data.department.trim() === '') {
            errors.push('El departamento es requerido');
        }

        if (!data.position || data.position.trim() === '') {
            errors.push('El cargo es requerido');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validar formato de email
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Obtener el conteo total de registros
    getCount() {
        return this.getAllRecords().length;
    }
}

// Instancia global de la base de datos
const db = new Database();