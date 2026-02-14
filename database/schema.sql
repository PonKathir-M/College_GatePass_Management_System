CREATE TABLE Users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(50),
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE Departments (
  department_id INT PRIMARY KEY AUTO_INCREMENT,
  department_name VARCHAR(100)
);

CREATE TABLE Students (
  student_id INT PRIMARY KEY AUTO_INCREMENT,
  year INT,
  category VARCHAR(50),
  parent_phone VARCHAR(15),
  active BOOLEAN,
  UserUserId INT,
  DepartmentDepartmentId INT
);

CREATE TABLE GatePasses (
  gatepass_id VARCHAR(50) PRIMARY KEY,
  reason VARCHAR(255),
  out_time TIME,
  expected_return TIME,
  StudentStudentId INT,
  status VARCHAR(50),
  rejection_reason VARCHAR(255)
);

CREATE TABLE SecurityLogs (
  log_id INT PRIMARY KEY AUTO_INCREMENT,
  actual_out DATETIME,
  actual_in DATETIME,
  GatePassGatepassId VARCHAR(50)
);

CREATE TABLE Notifications (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  UserUserId INT,
  sender VARCHAR(50),
  message VARCHAR(255),
  type VARCHAR(50),
  reference_id VARCHAR(100)
);
