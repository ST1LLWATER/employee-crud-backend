const { Sequelize } = require('sequelize');
const Employee = require('../models/Employee');
const Metadata = require('../models/Metadata');
const sequelize = require('../config/database');

const createEmployee = async (req, res) => {
  try {
    const body = req.body;
    const transaction = await sequelize.transaction();

    // Create the employee in the database
    const employee = await Employee.create(body, { transaction });
    const metadata = await Metadata.create(
      {
        employeeId: employee.id,
        ...body,
      },
      { transaction }
    );

    // Commit the transaction
    await transaction.commit();

    // Send a success response with the created employee

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    // Handle duplicate email error
    if (error instanceof Sequelize.UniqueConstraintError) {
      return res
        .status(400)
        .json({ success: false, error: 'Email already exists' });
    }

    if (error instanceof Sequelize.ValidationError) {
      return res
        .status(400)
        .json({ success: false, error: error.errors[0].message });
    }

    // Handle any errors that occur during creation
    console.error('Error creating employee:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to create employee' });
  }
};

const getEmployees = async (req, res) => {
  try {
    const { skip, lim } = req.query;

    // Get employees from the database
    const employees = await Employee.findOne({
      offset: skip ? parseInt(skip) : undefined,
      limit: lim ? parseInt(lim) : undefined,
    });

    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({ success: false, error: 'Failed to get employees' });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id, {
      include: { model: Metadata },
    });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: 'Employee not found' });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error('Error getting employee by id:', error);
    res.status(500).json({ success: false, error: 'Failed to get employee' });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
};