import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2,
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it('should update an order', async () => {
    const orderItem = new OrderItem('1', 'product1', 50, '2', 2);
    const order = new Order('1', 'customer1', [orderItem]);
    order.total = jest.fn().mockReturnValue(100);

    const orderRepository = new OrderRepository();

    jest.spyOn(OrderModel, 'update').mockResolvedValue([1]);

    await orderRepository.update(order);

    expect(OrderModel.update).toHaveBeenCalledWith(
      {
        customer_id: order.customerId,
        total: 100,
      },
      {
        where: {
          id: order.id,
        },
      },
    );
  });

  it('should throw an error if update fails', async () => {
    const orderItem = new OrderItem('1', 'product1', 50, '2', 2);
    const order = new Order('1', 'customer1', [orderItem]);
    order.total = jest.fn().mockReturnValue(100);

    const orderRepository = new OrderRepository();

    (OrderModel.update as jest.Mock).mockRejectedValue(new Error('Update failed'));

    await expect(orderRepository.update(order)).rejects.toThrow('Update failed');
  });

  it('should return an order when found', async () => {
    const mockOrder = {
      id: '1',
      customer_id: '123',
      items: [{
        id: '1',
        name: 'product1',
        price: 50,
        product_id: '2',
        quantity: 2,
      }] as OrderItemModel[],
    };

    jest.spyOn(OrderModel, 'findOne').mockResolvedValueOnce(mockOrder as any);

    const orderRepository = new OrderRepository();
    const result = await orderRepository.find('1');

    expect(result).toBeInstanceOf(Order);
    expect(result.id).toBe(mockOrder.id);
    expect(result.customerId).toBe(mockOrder.customer_id);
  });

  it('should throw an error when order is not found', async () => {
    (OrderModel.findOne as jest.Mock).mockResolvedValue(null);

    const orderRepository = new OrderRepository();
    jest.spyOn(OrderModel, 'findOne').mockRejectedValue(null);
    await expect(orderRepository.find('1')).rejects.toThrow('Order not found!');
  });


  it('should return a list of orders', async () => {
    const mockOrders = [
      {
        id: '1',
        customer_id: 'customer1',
        items: [
          { id: 'item1', name: 'item1', price: 100, product_id: 'product1', quantity: 1 },
          { id: 'item2', name: 'item2', price: 200, product_id: 'product2', quantity: 2 },
        ],
      },
      {
        id: '2',
        customer_id: 'customer2',
        items: [
          { id: 'item3', name: 'item3', price: 300, product_id: 'product3', quantity: 3 },
        ],
      },
    ];

    jest.spyOn(OrderModel, 'findAll').mockResolvedValue(mockOrders as any);

    const orderRepository = new OrderRepository();
    const orders = await orderRepository.findAll();

    expect(orders).toHaveLength(2);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orders[1]).toBeInstanceOf(Order);
  });

});
