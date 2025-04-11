// hooks/useCrud.js

import { useDataContext } from "@/contexts/DataContext";

export function useCrud(key) {
  const {
    createRecord,
    updateRecord,
    deleteRecord,
    [key]: state,
    [`set${capitalize(key)}`]: setState,
  } = useDataContext();
  const endpoint = `/api/${key}`;

  if (!endpoint) {
    throw new Error(`No endpoint found for key: ${key}`);
  }
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const create = (record) => createRecord(endpoint, record, setState);
  const update = (records) => updateRecord(endpoint, records, setState);
  const remove = (id) => deleteRecord(endpoint, id, setState);

  return {
    data: state,
    create,
    update,
    remove,
  };
}
