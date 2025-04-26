"""""""""""""""""""""""""""""""""""""""
NeuralNetwork.py
Модуль создания и обучения нейронной сети для распознавания рукописных цифр
с использованием метода градиентного спуска.
"""""""""""""""""""""""""""""""""""""""

import random
import json

from mnist_loader import *


class Network(object):
    def __init__(self, sizes):
        self.num_layers = len(sizes)
        self.sizes = sizes
        self.biases = [np.random.randn(y, 1) for y in sizes[1:]]
        self.weights = [np.random.randn(y, x) for x, y in zip(sizes[:-1], sizes[1:])]

    # Стохастический градиентный спуск
    def sgd(self, training_data, epochs, mini_batch_size, eta, test_data):
        n_test = len(test_data)
        n_train = len(training_data)
        for j in range(epochs):
            random.shuffle(training_data)
            mini_batches = [training_data[k:k + mini_batch_size] for k in range(0, n_train, mini_batch_size)]
            for mini_batch in mini_batches:
                self.update_mini_batch(mini_batch, eta)  # один шаг градиентного спуска
            print(f'Epoch {j}: {self.evaluate(test_data)} / {n_test}')

    # Шаг градиентного спуска
    def update_mini_batch(self, mini_batch, eta):
        nabla_b = [np.zeros(b.shape) for b in self.biases]
        nabla_w = [np.zeros(w.shape) for w in self.weights]  # список градиентов dC / dw
        for x, y in mini_batch:
            delta_nabla_b, delta_nabla_w = self.backprop(x, y)
            # послойно вычисляем градиенты dC / db и dC / dw для текущего прецедента(x, y)
            nabla_b = [nb + dnb for nb, dnb in zip(nabla_b, delta_nabla_b)]
            nabla_w = [nw + dnw for nw, dnw in zip(nabla_w, delta_nabla_w)]
            # суммирую градиенты dC / dw для различных прецедентов текущей подвыборки
        self.weights = [w - (eta / len(mini_batch)) * nw for w, nw in zip(self.weights, nabla_w)]
        self.biases = [b - (eta / len(mini_batch)) * nb for b, nb in zip(self.biases, nabla_b)]
        # обновляю все смещения b нейронной сети

    # Алгоритм обратного распространения
    def backprop(self, x, y):
        nabla_b = [np.zeros(b.shape) for b in self.biases]
        nabla_w = [np.zeros(w.shape) for w in self.weights]  # список градиентов dC / dw
        activation = x
        activations = [x]  # список выходных сигналов
        zs = []  # список активационных потенциалов

        # прямое распространение
        for b, w in zip(self.biases, self.weights):
            z = np.dot(w, activation) + b  # активационные потенциалы
            zs.append(z)
            activation = sigmoid(z)  # выходные сигналы
            activations.append(activation)

        # print(activations[-1])
        # print(y)
        # print(activations[-1]-y)
        # print(zs[-1])
        # print(sigmoid_prime(zs[-1]))
        # print('----------')

        # обратное распространение
        delta = self.cost_derivative(activations[-1], y) * sigmoid_prime(zs[-1])
        # мера влияния нейронов выходного слоя L на величину ошибки (BP1)
        nabla_b[-1] = delta  # градиент dC/db (BP3)
        nabla_w[-1] = np.dot(delta, activations[-2].transpose())  # градиент dC/dw (BP4)
        for line in range(2, self.num_layers):
            z = zs[-line]  # активационные потенциалы line-го слоя (по списку справа налево)
            delta = np.dot(self.weights[-line + 1].transpose(), delta) * sigmoid_prime(z)
            # мера влияния нейронов line-го слоя на величину ошибки (BP2)
            nabla_b[-line] = delta  # градиент dC/db (BP3)
            nabla_w[-line] = np.dot(delta, activations[-line - 1].transpose())  # градиент dC/dw (BP4)
        return nabla_b, nabla_w

    def evaluate(self, test_data):
        test_results = [(np.argmax(feedforward(x, self.biases, self.weights)), y) for x, y in test_data]
        return sum(int(x == y) for x, y in test_results)

    def cost_derivative(self, output_activations, y):  # Вычисление частных
        # производных стоимостной функции по выходным сигналам последнего слоя
        return output_activations - y


def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))


def sigmoid_prime(z):
    return sigmoid(z) * (1 - sigmoid(z))


def feedforward(a, biases, weights):
    for b, w in zip(biases, weights):
        a = sigmoid(np.dot(w, a) + b)
    return a


def training():
    imp_training_data, imp_validation_data, imp_test_data = load_data_wrapper()
    net = Network([784, 30, 10])
    net.sgd(imp_training_data, 10, 10, 3.0, test_data=imp_test_data)

    out_weights = [el.tolist() for el in net.weights]
    out_biases = [el.tolist() for el in net.biases]
    out_dict = {"weights": out_weights, "biases": out_biases}
    with open("buffer.json", "w") as file:
        json.dump(out_dict, file)
        file.flush()


def guess(input_list):
    input_list = list(input_list['inputList'].values())
    new_input_list = []
    for i in range(0, len(input_list), 4):
        r, g, b, a = input_list[i], input_list[i + 1], input_list[i + 2], input_list[i + 3]
        gray = (0.299 * r * 255 + 0.587 * g * 255 + 0.114 * b * 255)
        blackness = (255 - gray) * a / 255
        new_input_list.append(blackness)
    new_input_list = np.array(new_input_list, dtype=np.float32)
    input_list = np.reshape(new_input_list, (784, 1))

    with (open("buffer.json", "r") as file):
        text = json.load(file)
        res = np.argmax(feedforward(input_list, text["biases"], text["weights"]))
        print(res)
        return str(res.item())
