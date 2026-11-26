describe('Validacion del bloqueo del pipeline CI/CD', () => {

    test('Fallo intencional para impedir el despliegue en AWS EC2', () => {
        expect(true).toBe(false);
    });

});