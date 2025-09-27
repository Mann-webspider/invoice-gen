const request = require('supertest');
const app = require('../src/app');
const { DropdownOption, DropdownCategory } = require('../src/models');

describe('API Tests', () => {
    // Test data
    const testCategory = {
        name: 'test_category',
        description: 'Test category description'
    };

    const testOption = {
        category: 'test_category',
        value: 'test_value',
        label: 'Test Label',
        is_active: true,
        sort_order: 1
    };

    // Clean up database before and after tests
    beforeAll(async () => {
        await DropdownOption.destroy({ where: {} });
        await DropdownCategory.destroy({ where: {} });
    });

    afterAll(async () => {
        await DropdownOption.destroy({ where: {} });
        await DropdownCategory.destroy({ where: {} });
    });

    // Category Tests
    describe('Category Endpoints', () => {
        it('should create a new category', async () => {
            const response = await request(app)
                .post('/api/dropdown-categories')
                .send(testCategory)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.data.name).toBe(testCategory.name);
        });

        it('should get all categories', async () => {
            const response = await request(app)
                .get('/api/dropdown-categories')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    // Option Tests
    describe('Option Endpoints', () => {
        it('should create a new option', async () => {
            const response = await request(app)
                .post('/api/dropdown-options')
                .send(testOption)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(response.body.data.value).toBe(testOption.value);
        });

        it('should get all options', async () => {
            const response = await request(app)
                .get('/api/dropdown-options')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should get options by category', async () => {
            const response = await request(app)
                .get(`/api/dropdown-options/${testCategory.name}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should update an option', async () => {
            // First create an option
            const createResponse = await request(app)
                .post('/api/dropdown-options')
                .send(testOption);

            const optionId = createResponse.body.data.id;
            const updatedData = {
                label: 'Updated Label',
                is_active: false
            };

            const response = await request(app)
                .put(`/api/dropdown-options/${optionId}`)
                .send(updatedData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.label).toBe(updatedData.label);
            expect(response.body.data.is_active).toBe(updatedData.is_active);
        });

        it('should toggle option active status', async () => {
            // First create an option
            const createResponse = await request(app)
                .post('/api/dropdown-options')
                .send(testOption);

            const optionId = createResponse.body.data.id;
            const initialStatus = createResponse.body.data.is_active;

            const response = await request(app)
                .put(`/api/dropdown-options/${optionId}/toggle`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.is_active).toBe(!initialStatus);
        });

        it('should delete an option', async () => {
            // First create an option
            const createResponse = await request(app)
                .post('/api/dropdown-options')
                .send(testOption);

            const optionId = createResponse.body.data.id;

            await request(app)
                .delete(`/api/dropdown-options/${optionId}`)
                .expect(204);

            // Verify the option is deleted
            const getResponse = await request(app)
                .get(`/api/dropdown-options/${optionId}`)
                .expect(404);
        });
    });

    // All Dropdowns Test
    describe('All Dropdowns Endpoint', () => {
        it('should get all dropdown values', async () => {
            const response = await request(app)
                .get('/api/all-dropdowns')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('categories');
            expect(response.body.data).toHaveProperty('options');
        });
    });

    // Reorder Tests
    describe('Reorder Endpoint', () => {
        it('should reorder options in a category', async () => {
            // Create multiple options
            const options = [
                { ...testOption, sort_order: 1 },
                { ...testOption, value: 'test_value2', label: 'Test Label 2', sort_order: 2 },
                { ...testOption, value: 'test_value3', label: 'Test Label 3', sort_order: 3 }
            ];

            for (const option of options) {
                await request(app)
                    .post('/api/dropdown-options')
                    .send(option);
            }

            const newOrder = [3, 1, 2];
            const response = await request(app)
                .put(`/api/dropdown-options/${testCategory.name}/reorder`)
                .send({ orders: newOrder })
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(newOrder.length);
        });
    });

    // Error Handling Tests
    describe('Error Handling', () => {
        it('should handle invalid category', async () => {
            const response = await request(app)
                .get('/api/dropdown-options/invalid_category')
                .expect(404);

            expect(response.body.status).toBe('error');
        });

        it('should handle invalid option ID', async () => {
            const response = await request(app)
                .get('/api/dropdown-options/999999')
                .expect(404);

            expect(response.body.status).toBe('error');
        });

        it('should validate option creation data', async () => {
            const invalidOption = {
                category: 'test_category'
                // Missing required fields
            };

            const response = await request(app)
                .post('/api/dropdown-options')
                .send(invalidOption)
                .expect(400);

            expect(response.body.status).toBe('error');
            expect(response.body.errors).toBeDefined();
        });
    });
}); 