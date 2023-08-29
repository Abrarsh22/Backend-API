export default (sequelize, DataTypes) => {
    const Form = sequelize.define("form", {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      shortcode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      shopname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      formtitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      componentJSON: {
        type: DataTypes.JSON,
      },
      headerJSON: {
        type: DataTypes.JSON,
      },
      footerJSON: {
        type: DataTypes.JSON,
      },
      afterSubmit: {
        type: DataTypes.JSON,
      },
      klaviyoIntegration: {
        type: DataTypes.JSON,
      },                                                                                          
      shopifyIntegration: {
        type: DataTypes.JSON,
      },                                                                                          
      status: {
        type: DataTypes.BOOLEAN,
      },
      notifyFormStatus: {
        type: DataTypes.BOOLEAN,
      },
      formCSS: {
        type: DataTypes.JSON,
      },
      formSettings: {
        type: DataTypes.JSON,
      },
    });
  
    return Form;
  };
  