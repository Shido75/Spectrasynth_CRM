const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const Inquiry = require("./Inquiry");

const Quotation = sequelize.define(
  "Quotation",
  {
    quotation_number: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    quotation_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Foreign key linked with Inquiry's primary key (inquiry_number)
    inquiry_number: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Inquiry,
        key: "inquiry_number",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    quotation_pdf: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    gst: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    remark: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quotation_status: {
      type: DataTypes.ENUM("Temp. Quatation", "finalise", "send_email", "generate_po"),
      allowNull: false,
      defaultValue: "Temp. Quatation",
    },
  email_sent_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    email_sent_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reminder_days: {
  type: DataTypes.INTEGER,
  allowNull: true,
  defaultValue: null, // user can set it
},

next_reminder_date: {
  type: DataTypes.DATE,
  allowNull: true,
},

reminder_active: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
},

  },
  
  {
    tableName: "quotations",
    timestamps: true,
  }
);

// ✅ Associations
Quotation.belongsTo(Inquiry, {
  foreignKey: "inquiry_number",
  as: "inquiry",
});

Inquiry.hasMany(Quotation, {
  foreignKey: "inquiry_number",
  as: "quotations",
});



module.exports = Quotation;
