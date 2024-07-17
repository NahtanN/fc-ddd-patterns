import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      },
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        ...entity
      },
      {
        where: {
          id: entity.id,
        },
      },
    );
  }

  async find(id: string): Promise<Order> {
    let order: OrderModel;
    try {
      order = await OrderModel.findOne({
        where: {
          id,
        },
      });
    } catch (error) {
      throw new Error("Order not found!");
    }

    return new Order(order.id, order.customer_id, order.items.map(item => new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity)));
  }

  async findAll(): Promise<Order[]> {
    const orders = await OrderModel.findAll();

    return orders.map((order) => new Order(order.id, order.customer_id, order.items.map(item => new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity))));
  }
}
