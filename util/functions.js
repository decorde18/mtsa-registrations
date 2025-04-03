export function dateStringToExcelInt(dateString) {
  // Check if the dateString is already a number
  if (!isNaN(dateString)) {
    return dateString;
  }

  // Split the date string into month, day, and year
  const parts = dateString.split("/");
  if (parts.length !== 3) {
    return NaN; // Invalid date string format
  }

  const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed in JavaScript
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  // Create a JavaScript Date object (UTC to avoid timezone issues)
  const date = new Date(Date.UTC(year, month, day));

  // Excel's date system starts from January 0, 1900 (December 30, 1899 in reality)
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  let excelDateInt = Math.floor(
    (date.getTime() - excelEpoch.getTime()) / millisecondsInDay
  );

  // Adjust for the 1900 leap year bug
  if (excelDateInt >= 60 && date < new Date(Date.UTC(1900, 2, 1))) {
    excelDateInt++;
  }

  return excelDateInt;
}

export function addUniqueId(player) {
  if (
    typeof player.first_name !== "string" ||
    typeof player.last_name !== "string"
  )
    return {};
  const trimmedLastName = player.last_name
    ? player.last_name.trim().replace(/\s/g, "")
    : "";
  const trimmedFirstName = player.first_name
    ? player.first_name.trim().replace(/\s/g, "")
    : "";

  return {
    ...player,
    dob: dateStringToExcelInt(player.dob),
    unique_id:
      `${trimmedLastName}_${trimmedFirstName}_${dateStringToExcelInt(player.dob)}`.toLowerCase(),
  };
}
