// constants/fieldMappings.js

export const headerMap = {
  "Player Last Name": "last_name",
  "Player First Name": "first_name",
  "Street Address": "address",
  "Player Birth Date": "dob",
  Gender: "gender",
  City: "city",
  State: "state",
  "Postal Code": "zip",
  Cellphone: "phone",
  "User Email": "email",
};

export const headerMapMtsa = {
  "Other Phone": "other_phone",
  "Order Date": "order_date",
  "Order No": "order_no",
  "Order Detail Description": "order_detail_description",
  "OrderItem Amount": "order_item_amount",
  "OrderItem Amount Paid": "order_item_amount_paid",
  "OrderItem Balance": "order_item_balance",
  "Order Payment Status": "order_payment_status",
  "Division Name": "division_name",
  "Team Name": "team_name",
  "Program Name": "program_name",
};

export const playerFieldsToCheck = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "zip",
  "dob",
  "gender",
];
