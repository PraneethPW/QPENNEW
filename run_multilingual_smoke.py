import argparse
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description="Run QPEN smoke experiments across multiple target languages.")
    parser.add_argument("--tfm_type", default="mbert")
    parser.add_argument("--model_name_or_path", default="bert-base-multilingual-cased")
    parser.add_argument("--src_lang", default="en")
    parser.add_argument("--targets", default="fr,es,nl,ru,tr,hi,te")
    parser.add_argument("--exp_type", default="acs")
    parser.add_argument("--max_steps", type=int, default=2)
    parser.add_argument("--save_steps", type=int, default=1)
    parser.add_argument("--train_begin_saving_step", type=int, default=1)
    parser.add_argument("--eval_begin_end", default="1-3")
    args = parser.parse_args()

    for tgt_lang in [lang.strip() for lang in args.targets.split(",") if lang.strip()]:
        cmd = [
            sys.executable, "main.py",
            "--tfm_type", args.tfm_type,
            "--model_name_or_path", args.model_name_or_path,
            "--data_dir", "./data",
            "--src_lang", args.src_lang,
            "--tgt_lang", tgt_lang,
            "--exp_type", args.exp_type,
            "--tagging_schema", "BIOES",
            "--do_train",
            "--do_eval",
            "--ignore_cached_data",
            "--overwrite_output_dir",
            "--per_gpu_train_batch_size", "2",
            "--per_gpu_eval_batch_size", "2",
            "--learning_rate", "5e-5",
            "--max_steps", str(args.max_steps),
            "--save_steps", str(args.save_steps),
            "--train_begin_saving_step", str(args.train_begin_saving_step),
            "--eval_begin_end", args.eval_begin_end,
        ]
        print(f"Running {' '.join(cmd)}")
        subprocess.run(cmd, check=True)


if __name__ == "__main__":
    main()
