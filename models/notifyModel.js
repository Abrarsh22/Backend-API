export default (sequelize, DataTypes) => {
    const NotifyForm = sequelize.define("notifyform", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      shopname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      formid:{
        type:DataTypes.CHAR,
        allowNull:false
      },
      productId: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
    },{
        timestamps: true,
        createdAt: 'createdat', // Use your desired column name for createdAt
        updatedAt: 'updatedat', // Use your desired column name for updatedAt    
    });
  
    return NotifyForm;
  };
  