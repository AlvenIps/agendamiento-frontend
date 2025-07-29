import { watch } from 'vue';

export function useInputFilter<T extends Record<string, unknown>, K extends keyof T>(
  state: T,          // El objeto reactivo formData
  propertyName: K,   // El nombre de la propiedad a vigilar
  regex: RegExp      // La expresión regular para limpiar
) {
  watch(
    () => state[propertyName],
    (newValue) => {

      if (typeof newValue !== 'string') {
        return;
      }

      const filteredValue = newValue.replace(regex, '');

      if (state[propertyName] !== filteredValue) {
        state[propertyName] = filteredValue as T[K]; // actualizamos el valor
      }
    }
  );
}
