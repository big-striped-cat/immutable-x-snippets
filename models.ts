import { DataTypes, Model } from 'sequelize';
import { sequelize } from './db';


class Wallet extends Model {}


Wallet.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'Wallet',
    tableName: 'wallet',
    timestamps: false
});


const ProtoPrice = sequelize.define('ProtoPrice', {
    id: {
        type: DataTypes.INTEGER,
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
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    wallet_id: {
        type: DataTypes.INTEGER,
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


export { Wallet, ProtoPrice, Asset };
