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
import * as uuid from "uuid";

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

  it("should update an order", async () => {
    const customerRepository = new CustomerRepository();
    const customerId = uuid.v4();
    const customer = new Customer(customerId, "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const productId = uuid.v4();
    const product = new Product(productId, "Product 1", 10);
    await productRepository.create(product);

    const orderItemId = uuid.v4();
    const orderItem = new OrderItem(
      orderItemId,
      product.name,
      product.price,
      product.id,
      2,
    );

    const orderId = uuid.v4();
    const order = new Order(orderId, customerId, [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const newCustomerId = uuid.v4();
    const customer2 = new Customer(newCustomerId, "Customer 2");
    const address2 = new Address("Street 2", 2, "Zipcode 2", "City 2");
    customer2.changeAddress(address2);
    await customerRepository.create(customer2);

    order.changeCustomer(customer2.id);

    await orderRepository.update(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: orderId,
      customer_id: customer2.id,
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: orderId,
          product_id: productId,
        },
      ],
    });
  });

  it("should return an order when found", async () => {
    const mockOrder = {
      id: "1",
      customer_id: "123",
      items: [
        {
          id: "1",
          name: "product1",
          price: 50,
          product_id: "2",
          quantity: 2,
        },
      ] as OrderItemModel[],
    };

    jest.spyOn(OrderModel, "findOne").mockResolvedValueOnce(mockOrder as any);

    const orderRepository = new OrderRepository();
    const result = await orderRepository.find("1");

    expect(result).toBeInstanceOf(Order);
    expect(result.id).toBe(mockOrder.id);
    expect(result.customerId).toBe(mockOrder.customer_id);
  });

  it("should throw an error when order is not found", async () => {
    (OrderModel.findOne as jest.Mock).mockResolvedValue(null);

    const orderRepository = new OrderRepository();
    jest.spyOn(OrderModel, "findOne").mockRejectedValue(null);
    await expect(orderRepository.find("1")).rejects.toThrow("Order not found!");
  });

  it("should return a list of orders", async () => {
    const mockOrders = [
      {
        id: "1",
        customer_id: "customer1",
        items: [
          {
            id: "item1",
            name: "item1",
            price: 100,
            product_id: "product1",
            quantity: 1,
          },
          {
            id: "item2",
            name: "item2",
            price: 200,
            product_id: "product2",
            quantity: 2,
          },
        ],
      },
      {
        id: "2",
        customer_id: "customer2",
        items: [
          {
            id: "item3",
            name: "item3",
            price: 300,
            product_id: "product3",
            quantity: 3,
          },
        ],
      },
    ];

    jest.spyOn(OrderModel, "findAll").mockResolvedValue(mockOrders as any);

    const orderRepository = new OrderRepository();
    const orders = await orderRepository.findAll();

    expect(orders).toHaveLength(2);
    expect(orders[0]).toBeInstanceOf(Order);
    expect(orders[1]).toBeInstanceOf(Order);
  });
});
