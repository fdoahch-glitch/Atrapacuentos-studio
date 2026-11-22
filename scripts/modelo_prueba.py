# Crea un modelo ONNX de juguete (mismas entradas y salidas que Depth Anything) para probar el relieve sin bajar nada.
import sys, numpy as np, onnx
from onnx import helper, TensorProto as T, numpy_helper
x = helper.make_tensor_value_info('pixel_values', T.FLOAT, [1, 3, 518, 518]); y = helper.make_tensor_value_info('predicted_depth', T.FLOAT, [1, 518, 518])
pad = numpy_helper.from_array(np.zeros(300000, dtype=np.float32), 'relleno')
n = helper.make_node('ReduceMean', ['pixel_values'], ['predicted_depth'], axes=[1], keepdims=0)
m = helper.make_model(helper.make_graph([n], 'g', [x], [y], initializer=[pad]), opset_imports=[helper.make_opsetid('', 13)]); m.ir_version = 8
onnx.save(m, sys.argv[1])
