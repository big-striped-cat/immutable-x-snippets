import { DataTypes } from 'sequelize';
import { sequelize } from './db';


const ProtoPrice = sequelize.define('ProtoPrice', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    proto: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    price: {
        type: DataTypes.BIGINT,
        allowNull: false,
    }
}, {
    tableName: 'proto_price',
    timestamps: false
});


const Asset = sequelize.define('Asset', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    wallet: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    proto: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
}, {
    tableName: 'asset',
    timestamps: false
});


export { ProtoPrice, Asset };
